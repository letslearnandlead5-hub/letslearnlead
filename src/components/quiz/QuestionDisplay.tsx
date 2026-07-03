import React, { useMemo } from 'react';
import type { QuizQuestion } from '../../types';
import { FileCode, ArrowLeftRight } from 'lucide-react';
import RichTextDisplay from './RichTextDisplay';

interface QuestionDisplayProps {
    question: QuizQuestion;
    questionNumber: number;
    selectedAnswer?: string;
    onAnswerSelect: (answer: string) => void;
    disabled?: boolean;
}

// Fisher-Yates shuffle — deterministic per question ID so the order
// doesn't change when the component re-renders
function shuffleWithSeed<T>(arr: T[], seed: string): T[] {
    const copy = [...arr];
    // Simple seeded pseudo-random using char codes
    let s = Array.from(seed).reduce((acc, c) => acc + c.charCodeAt(0), 0);
    for (let i = copy.length - 1; i > 0; i--) {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        const j = Math.abs(s) % (i + 1);
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
    question,
    questionNumber,
    selectedAnswer,
    onAnswerSelect,
    disabled = false,
}) => {
    // ── Match the Following state helpers ────────────────────────────────────
    // Parse the current mapping from the JSON answer string
    const matchMapping: Record<string, string> = useMemo(() => {
        if (question.questionType !== 'match' || !selectedAnswer) return {};
        try { return JSON.parse(selectedAnswer); } catch { return {}; }
    }, [question.questionType, selectedAnswer]);

    // Shuffle the right-column items once per question (stable across renders)
    const shuffledRights = useMemo(() => {
        if (question.questionType !== 'match' || !question.matchPairs) return [];
        const seed = question._id || question.questionText.slice(0, 20);
        const stripHtmlLocal = (html: string) => html.replace(/<[^>]*>/g, '').trim();
        return shuffleWithSeed(
            question.matchPairs.map((p, i) => ({ originalIdx: i, text: stripHtmlLocal(p.right) })),
            seed
        );
    }, [question.questionType, question.matchPairs, question._id, question.questionText]);

    const handleMatchSelect = (leftIdx: number, selectedOriginalIdx: string) => {
        const newMapping = { ...matchMapping, [String(leftIdx)]: selectedOriginalIdx };
        onAnswerSelect(JSON.stringify(newMapping));
    };

    // ── Render question content ──────────────────────────────────────────────
    const renderQuestionContent = () => {
        switch (question.questionType) {
            case 'match':
                return (
                    <div className="space-y-4">
                        {/* Question text with rich formatting */}
                        <div className="text-lg text-gray-900 dark:text-white">
                            <RichTextDisplay content={question.questionText} />
                        </div>
                        {/* Optional question image */}
                        {question.questionImage && (
                            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                <img src={question.questionImage} alt="Question diagram" className="w-full max-h-80 object-contain bg-gray-50 dark:bg-gray-800" />
                            </div>
                        )}
                        {/* Match the Following grid */}
                        <div className="mt-4">
                            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                                <ArrowLeftRight className="w-4 h-4" />
                                Match each item in Column A with the correct item in Column B
                            </div>
                            {/* Column headers */}
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <div className="text-xs font-semibold text-center text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 rounded-lg py-2 px-3 border border-blue-200 dark:border-blue-800">
                                    Column A
                                </div>
                                <div className="text-xs font-semibold text-center text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950 rounded-lg py-2 px-3 border border-green-200 dark:border-green-800">
                                    Column B — Select Match ↓
                                </div>
                            </div>
                            {/* Pair rows */}
                            <div className="space-y-2">
                                {(question.matchPairs || []).map((pair, leftIdx) => {
                                    const currentSelection = matchMapping[String(leftIdx)];
                                    const hasAnswer = currentSelection !== undefined && currentSelection !== '';
                                    return (
                                        <div key={leftIdx} className="grid grid-cols-2 gap-3 items-center">
                                            {/* Column A item */}
                                            <div className={`px-4 py-3 rounded-lg border-2 text-sm font-medium text-gray-900 dark:text-white ${hasAnswer ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/40' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}`}>
                                                <span className="text-xs text-gray-400 mr-2">{leftIdx + 1}.</span>
                                                <RichTextDisplay content={pair.left} className="inline" />
                                            </div>
                                            {/* Column B dropdown */}
                                            <select
                                                value={currentSelection ?? ''}
                                                onChange={(e) => !disabled && handleMatchSelect(leftIdx, e.target.value)}
                                                disabled={disabled}
                                                className={`px-3 py-3 rounded-lg border-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-700 dark:text-white transition-all ${hasAnswer ? 'border-green-400 bg-green-50 dark:bg-green-950/40 text-gray-900 dark:text-white' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                            >
                                                <option value="">— Select match —</option>
                                                {shuffledRights.map(({ originalIdx, text }) => (
                                                    <option key={originalIdx} value={String(originalIdx)}>
                                                        {text}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                                Select the correct Column B item for each Column A entry. Partial marks are awarded per correct pair.
                            </p>
                        </div>
                    </div>
                );

            case 'formula':
                return (
                    <div className="space-y-4">
                        <div className="text-lg text-gray-900 dark:text-white">
                            <RichTextDisplay content={question.questionText} />
                        </div>
                        {question.questionImage && (
                            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                <img src={question.questionImage} alt="Question diagram" className="w-full max-h-80 object-contain bg-gray-50 dark:bg-gray-800" />
                            </div>
                        )}
                        {question.questionFormula && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileCode className="w-5 h-5 text-indigo-600" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Formula:</span>
                                </div>
                                <div className="font-mono text-base text-gray-900 dark:text-white">
                                    <RichTextDisplay content={question.questionFormula} />
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'diagram':
                return (
                    <div className="space-y-4">
                        <div className="text-lg text-gray-900 dark:text-white">
                            <RichTextDisplay content={question.questionText} />
                        </div>
                        {(question.questionImage || question.questionDiagram) && (
                            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                <img
                                    src={question.questionImage || question.questionDiagram}
                                    alt="Diagram"
                                    className="w-full max-h-96 object-contain bg-gray-50 dark:bg-gray-800"
                                />
                            </div>
                        )}
                    </div>
                );

            case 'image':
            case 'text':
            default:
                return (
                    <div className="space-y-4">
                        <div className="text-lg text-gray-900 dark:text-white">
                            <RichTextDisplay content={question.questionText} />
                        </div>
                        {/* Always render image if present (regardless of question type) */}
                        {question.questionImage && (
                            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                <img
                                    src={question.questionImage}
                                    alt="Question diagram"
                                    className="w-full max-h-96 object-contain bg-gray-50 dark:bg-gray-800"
                                />
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            {/* Question Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                    <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                        {questionNumber}
                    </span>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Question {questionNumber}
                            </span>
                            <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded">
                                {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                            </span>
                            {question.negativeMarks && question.negativeMarks > 0 && (
                                <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                                    -{question.negativeMarks} for wrong
                                </span>
                            )}
                            {question.questionType === 'match' && (
                                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded flex items-center gap-1">
                                    <ArrowLeftRight className="w-3 h-3" /> Match the Following
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Question Content */}
            <div className="mb-6">{renderQuestionContent()}</div>

            {/* MCQ Options — only for non-match types */}
            {question.questionType !== 'match' && (
                <div className="space-y-3">
                    {question.options.map((option) => (
                        <label
                            key={option.id}
                            className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedAnswer === option.id
                                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <input
                                type="radio"
                                name={`question-${question._id}`}
                                value={option.id}
                                checked={selectedAnswer === option.id}
                                onChange={() => !disabled && onAnswerSelect(option.id)}
                                disabled={disabled}
                                className="mt-1 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                            />
                             <div className="ml-3 flex-1 text-gray-900 dark:text-white">
                                 <RichTextDisplay content={option.text} />
                                 {option.imageUrl && (
                                     <img src={option.imageUrl} alt="Option image" className="max-h-32 rounded border border-gray-200 dark:border-gray-700 mt-2 object-contain" />
                                 )}
                             </div>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuestionDisplay;
