import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { Quiz } from '../models/Quiz';
import { Course } from '../models/Course';
import { QuizCategory } from '../models/QuizCategory';
import { ensureDefaultCategoriesForCourse } from '../routes/quizCategories';

async function runAudit() {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/websit-edu';
    console.log('🔌 Connecting to MongoDB for Quiz Audit & Migration...');
    await mongoose.connect(mongoURI);

    console.log('🔍 Starting Quiz Subject & Category Audit...');
    const quizzes = await Quiz.find({});
    console.log(`📊 Found ${quizzes.length} total quizzes in database.\n`);

    let stats = {
        total: quizzes.length,
        alreadyCorrect: 0,
        fixedSubject: 0,
        fixedCategory: 0,
        unmapped: 0,
    };

    const unmappedQuizzes: string[] = [];

    for (const quiz of quizzes) {
        let isUpdated = false;

        // Fetch course
        let course = null;
        if (quiz.courseId) {
            course = await Course.findById(quiz.courseId);
        }

        // 1. Audit / Fix Subject
        if (!quiz.subjectId && course && course.subjects && course.subjects.length > 0) {
            let matchedSub = null;

            // Try matching by subjectName
            if (quiz.subjectName) {
                matchedSub = course.subjects.find(
                    (s: any) => s.name.toLowerCase().trim() === quiz.subjectName.toLowerCase().trim()
                );
            }

            // Try matching by title keywords
            if (!matchedSub && quiz.title) {
                const titleLower = quiz.title.toLowerCase();
                matchedSub = course.subjects.find((s: any) =>
                    titleLower.includes(s.name.toLowerCase().trim())
                );
            }

            if (matchedSub) {
                quiz.subjectId = matchedSub._id;
                quiz.subjectName = matchedSub.name;
                isUpdated = true;
                stats.fixedSubject++;
                console.log(`✅ Fixed Subject for "${quiz.title}": ${matchedSub.name}`);
            }
        }

        // 2. Audit / Fix Category
        if (!quiz.categoryId && quiz.courseId) {
            // Ensure default categories exist for this course
            await ensureDefaultCategoriesForCourse(quiz.courseId.toString());

            const categories = await QuizCategory.find({
                courseId: quiz.courseId,
                isActive: true,
            });

            let matchedCat = null;
            if (quiz.categoryName) {
                matchedCat = categories.find(
                    (c) => c.name.toLowerCase().trim() === quiz.categoryName.toLowerCase().trim()
                );
            }

            if (!matchedCat && categories.length > 0) {
                // Default to 'General Exam' or first category
                matchedCat = categories.find((c) => c.name === 'General Exam') || categories[0];
            }

            if (matchedCat) {
                quiz.categoryId = matchedCat._id;
                quiz.categoryName = matchedCat.name;
                isUpdated = true;
                stats.fixedCategory++;
                console.log(`✅ Fixed Category for "${quiz.title}": ${matchedCat.name}`);
            }
        }

        if (isUpdated) {
            await quiz.save();
        }

        if (quiz.courseId && quiz.subjectId && quiz.categoryId) {
            if (!isUpdated) stats.alreadyCorrect++;
        } else {
            stats.unmapped++;
            unmappedQuizzes.push(`- "${quiz.title}" (ID: ${quiz._id}) | Course: ${quiz.courseName || 'None'} | Subject: ${quiz.subjectName || 'MISSING'} | Category: ${quiz.categoryName || 'MISSING'}`);
        }
    }

    console.log('\n==================================================');
    console.log('📌 QUIZ AUDIT & MIGRATION REPORT');
    console.log('==================================================');
    console.log(`Total Quizzes Evaluated: ${stats.total}`);
    console.log(`Already Fully Mapped:    ${stats.alreadyCorrect}`);
    console.log(`Auto-Fixed Subjects:     ${stats.fixedSubject}`);
    console.log(`Auto-Fixed Categories:   ${stats.fixedCategory}`);
    console.log(`Quizzes Needing Review:  ${stats.unmapped}`);

    if (unmappedQuizzes.length > 0) {
        console.log('\n⚠️  UNMAPPED QUIZZES REQUIRING ADMIN ATTENTION:');
        unmappedQuizzes.forEach((msg) => console.log(msg));
    } else {
        console.log('\n🎉 ALL QUIZZES ARE 100% FULLY MAPPED TO COURSE, SUBJECT, AND CATEGORY!');
    }

    await mongoose.disconnect();
    console.log('\nDone.');
}

runAudit().catch((err) => {
    console.error('❌ Audit Script Error:', err);
    process.exit(1);
});
