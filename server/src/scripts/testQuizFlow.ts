import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Quiz } from '../models/Quiz';

dotenv.config({ path: path.join(__dirname, '../../.env') });

function sanitizeQuizForStudent(quiz: any) {
    const qObj = quiz.toObject ? quiz.toObject() : JSON.parse(JSON.stringify(quiz));

    qObj.questions = (qObj.questions || []).map((q: any, idx: number) => {
        const rawOptions = Array.isArray(q.options) ? q.options : [];
        const normalizedOptions = rawOptions.map((opt: any, oIdx: number) => {
            if (typeof opt === 'string') {
                return { id: String(oIdx + 1), text: opt };
            }
            if (opt && typeof opt === 'object') {
                return {
                    id: String(opt.id || opt._id || oIdx + 1),
                    text: String(opt.text || opt.value || opt.label || ''),
                    imageUrl: opt.imageUrl || undefined,
                };
            }
            return { id: String(oIdx + 1), text: String(opt || '') };
        });

        const rawMatchPairs = Array.isArray(q.matchPairs) ? q.matchPairs : [];
        const normalizedMatchPairs = rawMatchPairs.map((p: any, pIdx: number) => ({
            id: String(p.id || p._id || `pair_${pIdx + 1}`),
            left: String(p.left || ''),
            right: String(p.right || ''),
            order: typeof p.order === 'number' ? p.order : pIdx,
        }));

        return {
            _id: q._id ? q._id.toString() : `q_${idx}_${Date.now()}`,
            questionType: q.questionType || 'text',
            questionText: q.questionText || '',
            questionImage: q.questionImage || undefined,
            questionFormula: q.questionFormula || undefined,
            questionDiagram: q.questionDiagram || undefined,
            options: normalizedOptions,
            matchPairs: normalizedMatchPairs,
            explanation: q.explanation || '',
            marks: typeof q.marks === 'number' ? q.marks : 1,
            negativeMarks: typeof q.negativeMarks === 'number' ? q.negativeMarks : 0,
            order: typeof q.order === 'number' ? q.order : idx,
        };
    });

    return qObj;
}

async function runQuizTest() {
    try {
        console.log('--- STARTING QUIZ FLOW INTEGRATION TEST ---');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/letslearnlead');
        console.log('✅ Connected to MongoDB');

        const totalQuizzes = await Quiz.countDocuments();
        console.log(`📊 Total Quizzes in DB: ${totalQuizzes}`);

        const sampleQuiz = await Quiz.findOne();
        if (sampleQuiz) {
            console.log(`🔍 Testing Quiz Sanitizer on "${sampleQuiz.title}"...`);
            const sanitized = sanitizeQuizForStudent(sampleQuiz);
            console.log(`✅ Sanitized quiz questions count: ${sanitized.questions.length}`);
            sanitized.questions.forEach((q: any, idx: number) => {
                console.log(`   [Q${idx + 1}] Type: ${q.questionType} | Text: "${q.questionText.substring(0, 40)}..." | Options: ${q.options.length} | Pairs: ${q.matchPairs.length}`);
            });
        } else {
            console.log('⚠️ No quiz found in DB for test.');
        }

        console.log('\n--- QUIZ FLOW INTEGRATION TEST COMPLETED SUCCESSFULLY ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed with error:', err);
        process.exit(1);
    }
}

runQuizTest();
