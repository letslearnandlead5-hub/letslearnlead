import dotenv from 'dotenv';
dotenv.config();
import mongoose, { Schema } from 'mongoose';

const EnrollmentSchema = new Schema({
    userId: Schema.Types.ObjectId,
    courseId: Schema.Types.ObjectId,
    subjectId: { type: Schema.Types.ObjectId, default: null },
    subjectName: String,
    status: String,
    amount: Number,
    currency: String,
    purchaseDate: Date,
    completionPercentage: Number,
}, { timestamps: true });

const Enrollment = mongoose.models.Enrollment || mongoose.model('Enrollment', EnrollmentSchema);

async function run() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/letslearnlead';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const paid: any[] = await Enrollment.find({
        status: 'paid',
        subjectId: { $ne: null, $exists: true },
    }).lean() as any[];

    console.log(`Found ${paid.length} subject-level paid enrollments`);

    const map = new Map<string, any>();
    for (const e of paid) {
        const k = `${e.userId}-${e.courseId}`;
        if (!map.has(k)) map.set(k, e);
    }

    let created = 0, skipped = 0;
    for (const [k, data] of map) {
        const existing = await Enrollment.findOne({
            userId: data.userId,
            courseId: data.courseId,
            subjectId: null,
        });
        if (existing) {
            console.log(`SKIP (exists): ${k}`);
            skipped++;
            continue;
        }
        await Enrollment.create({
            userId: data.userId,
            courseId: data.courseId,
            subjectId: null,
            subjectName: '',
            status: 'paid',
            amount: data.amount || 0,
            currency: data.currency || 'INR',
            purchaseDate: data.purchaseDate || new Date(),
            completionPercentage: 0,
        });
        console.log(`CREATED course-level enrollment: ${k}`);
        created++;
    }

    console.log(`\nMigration complete. Created: ${created}, Skipped: ${skipped}`);
    await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
