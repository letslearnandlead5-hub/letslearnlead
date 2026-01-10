import React from 'react';
import type { QuizQuestion } from '../../types';
import { FileCode } from 'lucide-react';

interface QuestionDisplayProps {
    question: QuizQuestion;
    questionNumber: number;
    selectedAnswer?: string;
    onAnswerSelect: (answer: string) => void;
    disabled?: boolean;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
    question,
    questionNumber,
    selectedAnswer,
    onAnswerSelect,
    disabled = false,
}) => {
    const renderQuestionContent = () => {
        switch (question.questionType) {
            case 'text':
                return (
                    <div className="text-lg text-gray-900 dark:text-white whitespace-pre-wrap">
                        {question.questionText}
                    </div>
                );

            case 'image':
                return (
                    <div className="space-y-4">
                        <div className="text-lg text-gray-900 dark:text-white whitespace-pre-wrap">
                            {question.questionText}
                        </div>
                        {question.questionImage && (
                            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                <img
                                    src={question.questionImage}
                                    alt="Question"
                                    className="w-full max-h-96 object-contain bg-gray-50 dark:bg-gray-800"
                                />
                            </div>
                        )}
                    </div>
                );

            case 'formula':
                return (
                    <div className="space-y-4">
                        <div className="text-lg text-gray-900 dark:text-white whitespace-pre-wrap">
                            {question.questionText}
                        </div>
                        {question.questionFormula && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileCode className="w-5 h-5 text-indigo-600" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Formula:
                                    </span>
                                </div>
                                <div className="font-mono text-base text-gray-900 dark:text-white">
                                    {question.questionFormula}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'diagram':
                return (
                    <div className="space-y-4">
                        <div className="text-lg text-gray-900 dark:text-white whitespace-pre-wrap">
                            {question.questionText}
                        </div>
                        {question.questionDiagram && (
                            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                <img
                                    src={question.questionDiagram}
                                    alt="Diagram"
                                    className="w-full max-h-96 object-contain bg-gray-50 dark:bg-gray-800"
                                />
                            </div>
                        )}
                    </div>
                );

            default:
                return (
                    <div className="text-lg text-gray-900 dark:text-white">
                        {question.questionText}
                    </div>
                );
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            {/* Question Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                        {questionNumber}
                    </span>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
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
                        </div>
                    </div>
                </div>
            </div>

            {/* Question Content */}
            <div className="mb-6">{renderQuestionContent()}</div>

            {/* Options */}
            <div className="space-y-3">
                {question.options.map((option) => (
                    <label
                        key={option.id}
                        className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedAnswer === option.id
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
                        <div className="ml-3 flex-1">
                            {option.imageUrl ? (
                                <div className="space-y-2">
                                    <span className="text-gray-900 dark:text-white">{option.text}</span>
                                    <img
                                        src={option.imageUrl}
                                        alt={option.text}
                                        className="max-h-32 rounded border border-gray-200 dark:border-gray-700"
                                    />
                                </div>
                            ) : (
                                <span className="text-gray-900 dark:text-white">{option.text}</span>
                            )}
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default QuestionDisplay;
