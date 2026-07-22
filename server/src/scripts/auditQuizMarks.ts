import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Quiz } from '../models/Quiz';
import { QuizResult } from '../models/QuizResult';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function auditAndSanitizeQuizzes() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/websit-edu';
    console.log(`[AUDIT] Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('[AUDIT] Connected successfully.');

    const quizzes = await Quiz.find();
    console.log(`[AUDIT] Found ${quizzes.length} total quizzes in Database.`);

    let fixedCount = 0;
    const auditReport: Array<{
        quizId: string;
        title: string;
        totalQuestions: number;
        expectedTotalMarks: number;
        actualTotalMarksSum: number;
        discrepancies: string[];
    }> = [];

    for (const quiz of quizzes) {
        const defaultMarks = Number(quiz.settings?.marksPerQuestion) || 4;
        const defaultNegative = Number(quiz.settings?.negativeMarking) || 0;
        let modified = false;
        const discrepancies: string[] = [];

        // 1. Check totalQuestions count
        if (quiz.totalQuestions !== quiz.questions.length) {
            discrepancies.push(`totalQuestions mismatch: recorded ${quiz.totalQuestions}, actual questions count ${quiz.questions.length}`);
            quiz.totalQuestions = quiz.questions.length;
            modified = true;
        }

        // 2. Audit each question's marks
        let questionSum = 0;
        quiz.questions.forEach((q: any, idx: number) => {
            const currentMarks = q.marks;
            if (typeof currentMarks !== 'number' || isNaN(currentMarks) || currentMarks <= 0) {
                discrepancies.push(`Question #${idx + 1} (${q._id}) has invalid marks '${currentMarks}'. Resetting to defaultMarks=${defaultMarks}`);
                q.marks = defaultMarks;
                modified = true;
            }
            if (q.negativeMarks === undefined || q.negativeMarks === null || isNaN(q.negativeMarks)) {
                q.negativeMarks = defaultNegative;
                modified = true;
            }
            questionSum += q.marks;
        });

        const expectedMarks = quiz.questions.length * defaultMarks;
        if (questionSum !== expectedMarks) {
            discrepancies.push(`Sum of question marks (${questionSum}) does not equal expected standard marks (${expectedMarks}).`);
        }

        auditReport.push({
            quizId: quiz._id.toString(),
            title: quiz.title,
            totalQuestions: quiz.questions.length,
            expectedTotalMarks: expectedMarks,
            actualTotalMarksSum: questionSum,
            discrepancies,
        });

        if (modified) {
            await quiz.save();
            fixedCount++;
            console.log(`[AUDIT FIX] Quiz "${quiz.title}" (${quiz._id}) sanitized and saved.`);
        }
    }

    console.log('\n=================== QUIZ MARKS AUDIT REPORT ===================');
    console.table(auditReport);
    console.log(`================================================================`);
    console.log(`[AUDIT COMPLETE] Audited: ${quizzes.length} | Fixed/Sanitized: ${fixedCount}\n`);

    await mongoose.disconnect();
}

auditAndSanitizeQuizzes().catch((err) => {
    console.error('[AUDIT FAILED]', err);
    process.exit(1);
});
