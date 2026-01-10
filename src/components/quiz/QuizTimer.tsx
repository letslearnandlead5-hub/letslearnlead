import React, { useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { formatTimeRemaining } from '../../services/quizService';

interface QuizTimerProps {
    timeRemaining: number; // in seconds
    totalTime: number; // in seconds
    onTimeUp: () => void;
}

const QuizTimer: React.FC<QuizTimerProps> = ({ timeRemaining, totalTime, onTimeUp }) => {
    useEffect(() => {
        if (timeRemaining <= 0) {
            onTimeUp();
        }
    }, [timeRemaining, onTimeUp]);

    const percentage = (timeRemaining / totalTime) * 100;

    const getTimerColor = () => {
        if (percentage <= 10) return 'text-red-600 dark:text-red-400';
        if (percentage <= 25) return 'text-orange-600 dark:text-orange-400';
        if (percentage <= 50) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-green-600 dark:text-green-400';
    };

    const getBgColor = () => {
        if (percentage <= 10) return 'bg-red-100 dark:bg-red-900/30';
        if (percentage <= 25) return 'bg-orange-100 dark:bg-orange-900/30';
        if (percentage <= 50) return 'bg-yellow-100 dark:bg-yellow-900/30';
        return 'bg-green-100 dark:bg-green-900/30';
    };

    const showWarning = percentage <= 10;

    return (
        <div className={`sticky top-0 z-50 ${getBgColor()} border-b border-gray-200 dark:border-gray-700`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Clock className={`w-6 h-6 ${getTimerColor()} ${showWarning ? 'animate-pulse' : ''}`} />
                        <div>
                            <div className={`text-2xl font-bold ${getTimerColor()}`}>
                                {formatTimeRemaining(timeRemaining)}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Time Remaining</div>
                        </div>
                    </div>

                    {showWarning && (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 animate-pulse">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-semibold">Time Running Out!</span>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-1000 ${percentage <= 10
                                ? 'bg-red-600'
                                : percentage <= 25
                                    ? 'bg-orange-600'
                                    : percentage <= 50
                                        ? 'bg-yellow-600'
                                        : 'bg-green-600'
                            }`}
                        style={{ width: `${Math.max(0, percentage)}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default QuizTimer;
