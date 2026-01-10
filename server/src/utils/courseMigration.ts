import { Course } from '../models/Course';

/**
 * Migration utility to convert legacy lessons array to the new sections structure
 * This ensures backward compatibility for existing courses
 */
export async function migrateLessonsToSections() {
    try {
        console.log('🔄 Starting migration: lessons → sections');

        // Find all courses that have lessons but no sections
        const coursesToMigrate = await Course.find({
            $and: [
                { lessons: { $exists: true, $ne: [] } },
                { $or: [{ sections: { $exists: false } }, { sections: { $size: 0 } }] }
            ]
        });

        console.log(`📊 Found ${coursesToMigrate.length} courses to migrate`);

        let migratedCount = 0;
        for (const course of coursesToMigrate) {
            // Create a default section with all lessons as content items
            const defaultSection = {
                title: 'Course Content',
                description: 'Main course content',
                order: 0,
                subsections: [
                    {
                        title: 'Lessons',
                        description: 'All course lessons',
                        order: 0,
                        content: course.lessons.map((lesson: any, index: number) => ({
                            type: 'video',
                            title: lesson.title,
                            description: lesson.description,
                            videoUrl: lesson.videoUrl,
                            duration: lesson.duration,
                            order: lesson.order || index,
                            isFree: false,
                        }))
                    }
                ]
            };

            course.sections = [defaultSection];
            await course.save();
            migratedCount++;
        }

        console.log(`✅ Migration complete: ${migratedCount} courses migrated`);
        return { success: true, migratedCount };
    } catch (error) {
        console.error('❌ Migration failed:', error);
        return { success: false, error };
    }
}

/**
 * Helper function to calculate total content items in a course
 */
export function getTotalContentItems(course: any): number {
    return course.sections.reduce((total: number, section: any) => {
        return total + section.subsections.reduce((subTotal: number, subsection: any) => {
            return subTotal + subsection.content.length;
        }, 0);
    }, 0);
}

/**
 * Helper function to calculate total duration of a course
 */
export function calculateCourseDuration(course: any): string {
    let totalMinutes = 0;

    course.sections.forEach((section: any) => {
        section.subsections.forEach((subsection: any) => {
            subsection.content.forEach((item: any) => {
                if (item.duration) {
                    const parts = item.duration.split(':');
                    const hours = parts.length === 3 ? parseInt(parts[0]) : 0;
                    const minutes = parts.length === 3 ? parseInt(parts[1]) : parseInt(parts[0]);
                    const seconds = parts.length === 3 ? parseInt(parts[2]) : parseInt(parts[1] || 0);
                    totalMinutes += hours * 60 + minutes + seconds / 60;
                }
            });
        });
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}
