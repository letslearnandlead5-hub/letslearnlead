import assert from 'assert';

/**
 * Quiz Calculation Evaluation Engine (Simulated for automated testing)
 */
function evaluateQuizAttemptSimulated(
    quiz: {
        settings: { marksPerQuestion: number; negativeMarking: number; passingPercentage?: number };
        questions: Array<{ _id: string; marks?: number; negativeMarks?: number; correctAnswer: string }>;
    },
    answers: Record<string, string>
) {
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unansweredQuestions = 0;
    let marksObtained = 0;
    let totalMarks = 0;

    const defaultMarks = Number(quiz.settings?.marksPerQuestion) || 4;
    const defaultNegative = Number(quiz.settings?.negativeMarking) || 0;

    const questionResults = quiz.questions.map((question, idx) => {
        const studentAns = answers[question._id];

        const marks = typeof question.marks === 'number' && !isNaN(question.marks) && question.marks > 0
            ? question.marks
            : defaultMarks;

        const negativeMarks = typeof question.negativeMarks === 'number' && !isNaN(question.negativeMarks) && question.negativeMarks >= 0
            ? question.negativeMarks
            : defaultNegative;

        // Total marks is ALWAYS the sum of base marks of all questions
        totalMarks += marks;

        if (!studentAns) {
            unansweredQuestions++;
            return { questionId: question._id, isCorrect: false, marksAwarded: 0 };
        }

        const isCorrect = studentAns === question.correctAnswer;
        const awardedMarks = isCorrect ? marks : -negativeMarks;

        if (isCorrect) {
            correctAnswers++;
            marksObtained += marks;
        } else {
            incorrectAnswers++;
            marksObtained -= negativeMarks;
        }

        return { questionId: question._id, isCorrect, marksAwarded: isCorrect ? marks : -negativeMarks };
    });

    marksObtained = Math.max(0, marksObtained);
    const totalQuestions = quiz.questions.length;
    const percentage = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;

    return {
        totalQuestions,
        totalMarks,
        marksObtained,
        correctAnswers,
        incorrectAnswers,
        unansweredQuestions,
        percentage,
        questionResults,
    };
}

// ─── TEST SUITE ───────────────────────────────────────────────────────────────

function runQuizCalculationTests() {
    console.log('=================== RUNNING QUIZ CALCULATION TESTS ===================\n');

    // TEST 1: 45 questions @ 4 marks = 180 total marks (All correct)
    console.log('👉 TEST 1: 45 questions @ 4 marks (100% correct answers)');
    const quiz45 = {
        settings: { marksPerQuestion: 4, negativeMarking: 1 },
        questions: Array.from({ length: 45 }, (_, i) => ({
            _id: `q_${i + 1}`,
            correctAnswer: 'A',
        })),
    };
    const answers45AllCorrect = quiz45.questions.reduce((acc, q) => ({ ...acc, [q._id]: 'A' }), {});
    const res1 = evaluateQuizAttemptSimulated(quiz45, answers45AllCorrect);

    console.log(`   Total Questions: ${res1.totalQuestions} (Expected: 45)`);
    console.log(`   Total Marks: ${res1.totalMarks} (Expected: 180)`);
    console.log(`   Marks Obtained: ${res1.marksObtained} (Expected: 180)`);
    console.log(`   Percentage: ${res1.percentage}% (Expected: 100%)`);
    if (res1.totalMarks !== 180 || res1.marksObtained !== 180) throw new Error('TEST 1 FAILED!');
    console.log('   ✅ TEST 1 PASSED!\n');

    // TEST 2: 90 questions @ 4 marks = 360 total marks
    console.log('👉 TEST 2: 90 questions @ 4 marks (100% correct answers)');
    const quiz90 = {
        settings: { marksPerQuestion: 4, negativeMarking: 1 },
        questions: Array.from({ length: 90 }, (_, i) => ({
            _id: `q_${i + 1}`,
            correctAnswer: 'B',
        })),
    };
    const answers90AllCorrect = quiz90.questions.reduce((acc, q) => ({ ...acc, [q._id]: 'B' }), {});
    const res2 = evaluateQuizAttemptSimulated(quiz90, answers90AllCorrect);

    console.log(`   Total Questions: ${res2.totalQuestions} (Expected: 90)`);
    console.log(`   Total Marks: ${res2.totalMarks} (Expected: 360)`);
    console.log(`   Marks Obtained: ${res2.marksObtained} (Expected: 360)`);
    if (res2.totalMarks !== 360 || res2.marksObtained !== 360) throw new Error('TEST 2 FAILED!');
    console.log('   ✅ TEST 2 PASSED!\n');

    // TEST 3: Negative Marking (45 questions @ 4 marks = 180 total; 43 correct [172 marks], 2 wrong [-2 negative])
    console.log('👉 TEST 3: Negative marking (43 correct, 2 wrong)');
    const answers43Correct2Wrong: Record<string, string> = {};
    quiz45.questions.forEach((q, idx) => {
        answers43Correct2Wrong[q._id] = idx < 43 ? 'A' : 'B'; // 43 correct 'A', 2 wrong 'B'
    });
    const res3 = evaluateQuizAttemptSimulated(quiz45, answers43Correct2Wrong);

    console.log(`   Total Marks: ${res3.totalMarks} (MUST REMAIN 180)`);
    console.log(`   Marks Obtained: ${res3.marksObtained} (Expected: 172 - 2 = 170)`);
    console.log(`   Correct: ${res3.correctAnswers}, Wrong: ${res3.incorrectAnswers}`);
    if (res3.totalMarks !== 180) throw new Error('TEST 3 FAILED: Total marks was modified by negative marking!');
    if (res3.marksObtained !== 170) throw new Error('TEST 3 FAILED: Obtained marks incorrect!');
    console.log('   ✅ TEST 3 PASSED! (Total marks remained 180, negative deducted from obtained only)\n');

    // TEST 4: Mixed-mark quiz (5 questions @ 2 marks + 5 questions @ 4 marks = 30 total marks)
    console.log('👉 TEST 4: Mixed-mark quiz (5 @ 2 marks + 5 @ 4 marks)');
    const quizMixed = {
        settings: { marksPerQuestion: 4, negativeMarking: 1 },
        questions: [
            ...Array.from({ length: 5 }, (_, i) => ({ _id: `q_2m_${i}`, marks: 2, correctAnswer: 'A' })),
            ...Array.from({ length: 5 }, (_, i) => ({ _id: `q_4m_${i}`, marks: 4, correctAnswer: 'A' })),
        ],
    };
    const answersMixedAllCorrect = quizMixed.questions.reduce((acc, q) => ({ ...acc, [q._id]: 'A' }), {});
    const res4 = evaluateQuizAttemptSimulated(quizMixed, answersMixedAllCorrect);

    console.log(`   Total Questions: ${res4.totalQuestions} (Expected: 10)`);
    console.log(`   Total Marks: ${res4.totalMarks} (Expected: 30)`);
    console.log(`   Marks Obtained: ${res4.marksObtained} (Expected: 30)`);
    if (res4.totalMarks !== 30 || res4.marksObtained !== 30) throw new Error('TEST 4 FAILED!');
    console.log('   ✅ TEST 4 PASSED!\n');

    // TEST 5: Skipped questions (45 questions @ 4 marks = 180 total; 40 answered correct, 5 skipped)
    console.log('👉 TEST 5: Skipped questions (40 answered correct, 5 skipped)');
    const answers40Correct5Skipped: Record<string, string> = {};
    quiz45.questions.forEach((q, idx) => {
        if (idx < 40) answers40Correct5Skipped[q._id] = 'A';
    });
    const res5 = evaluateQuizAttemptSimulated(quiz45, answers40Correct5Skipped);

    console.log(`   Total Marks: ${res5.totalMarks} (Expected: 180)`);
    console.log(`   Marks Obtained: ${res5.marksObtained} (Expected: 160)`);
    console.log(`   Skipped Questions: ${res5.unansweredQuestions} (Expected: 5)`);
    if (res5.totalMarks !== 180 || res5.marksObtained !== 160 || res5.unansweredQuestions !== 5) throw new Error('TEST 5 FAILED!');
    console.log('   ✅ TEST 5 PASSED!\n');

    console.log('🎉 ================= ALL QUIZ CALCULATION TESTS PASSED ================= 🎉');
}

runQuizCalculationTests();
