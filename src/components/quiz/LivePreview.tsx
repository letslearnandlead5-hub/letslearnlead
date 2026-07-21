import React, { useState } from 'react';
import type { QuizQuestion } from '../../types';
import RichTextDisplay from './RichTextDisplay';
import { ArrowLeftRight, X, Eye } from 'lucide-react';
import { stripHtmlToText } from '../../utils/htmlUtils';

interface LivePreviewProps {
    question: Partial<QuizQuestion>;
    questionNumber: number;
    isOpen: boolean;
    onClose: () => void;
}

const LivePreview: React.FC<LivePreviewProps> = ({
    question,
    questionNumber,
    isOpen,
    onClose,
}) => {
    const [selectedOption, setSelectedOption] = useState<string>('');
    const [matchAnswers, setMatchAnswers] = useState<Record<string, string>>({});

    if (!isOpen) return null;

    // Simulate match selection
    const handleMatchSelect = (leftIdx: number, rightVal: string) => {
        setMatchAnswers(prev => ({
            ...prev,
            [String(leftIdx)]: rightVal,
        }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[85vh] animate-scale-in">
                {/* Header */}
                <div className="px-6 py-4 bg-indigo-50 dark:bg-indigo-950/40 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                        <Eye className="w-5 h-5 animate-pulse" />
                        <span className="font-bold">Student View Live Preview</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="flex-shrink-0 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                    {questionNumber}
                                </span>
                                <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded">
                                    {question.marks || 1} {question.marks === 1 ? 'mark' : 'marks'}
                                </span>
                                {question.negativeMarks && question.negativeMarks > 0 ? (
                                    <span className="text-xs font-semibold text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900/60 px-2 py-0.5 rounded">
                                        -{question.negativeMarks} wrong
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        {/* Question Text */}
                        <div className="mb-4">
                            <RichTextDisplay
                                content={question.questionText || '<p className="text-gray-400 italic">No question text entered yet</p>'}
                                className="text-gray-900 dark:text-white text-base leading-relaxed"
                            />
                        </div>

                        {/* Question Image (from static upload field, if any) */}
                        {question.questionImage && (
                            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-4 bg-white dark:bg-gray-800">
                                <img
                                    src={question.questionImage}
                                    alt="Question Diagram"
                                    className="max-h-64 mx-auto object-contain p-2"
                                />
                            </div>
                        )}

                        {/* Options / Matches */}
                        {question.questionType === 'match' ? (
                            <div className="space-y-3 mt-4">
                                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                    <ArrowLeftRight className="w-3.5 h-3.5" />
                                    Match Columns
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    <div>Column A</div>
                                    <div>Column B Match</div>
                                </div>
                                <div className="space-y-2">
                                    {(question.matchPairs || []).map((pair, idx) => (
                                        // KEY FIX: stable pair.id, not array index
                                        <div key={pair.id || `prev-${idx}`} className="grid grid-cols-2 gap-2 items-center">
                                            <div className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white">
                                                <RichTextDisplay content={pair.left || `Item ${idx + 1}`} />
                                            </div>
                                            <select
                                                value={matchAnswers[String(idx)] || ''}
                                                onChange={(e) => handleMatchSelect(idx, e.target.value)}
                                                className="px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                            >
                                                <option value="">— Select —</option>
                                                {(question.matchPairs || []).map((p, pIdx) => (
                                                    // Use stripHtmlToText so dropdown shows plain text, not HTML entities
                                                    <option key={p.id || `opt-${pIdx}`} value={p.right}>
                                                        {stripHtmlToText(p.right) || `Match ${pIdx + 1}`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2.5 mt-4">
                                {(question.options || []).map((opt) => {
                                    const isSelected = selectedOption === opt.id;
                                    return (
                                        <div
                                            key={opt.id}
                                            onClick={() => setSelectedOption(opt.id)}
                                            className={`flex items-start p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/30'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border flex-shrink-0 mt-1 flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 dark:border-600'}`}>
                                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                            <div className="ml-3 text-sm text-gray-900 dark:text-white w-full">
                                                <RichTextDisplay content={opt.text || `Option Option Option`} />
                                                {opt.imageUrl && (
                                                    <img
                                                        src={opt.imageUrl}
                                                        alt="Option image"
                                                        className="max-h-24 rounded border border-gray-200 dark:border-gray-700 mt-2 object-contain"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                        <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-900/50 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-green-800 dark:text-green-300 mb-1.5">Answer Explanation</h4>
                            <RichTextDisplay
                                content={question.explanation}
                                className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-lg hover:shadow-indigo-500/20"
                    >
                        Close Preview
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LivePreview;
