import React, { forwardRef, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/helpers';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        { className, label, error, leftIcon, rightIcon, type = 'text', ...props },
        ref
    ) => {
        const [isFocused, setIsFocused] = useState(false);
        const [hasValue, setHasValue] = useState(false);

        const handleFocus = () => setIsFocused(true);
        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);
            setHasValue(e.target.value !== '');
            props.onBlur?.(e);
        };

        return (
            <div className="w-full">
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {leftIcon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        type={type}
                        className={cn(
                            'peer w-full px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                            error
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-200 dark:border-gray-700',
                            leftIcon ? 'pl-10' : '',
                            rightIcon ? 'pr-10' : '',
                            label && 'pt-6',
                            className
                        )}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholder={!label ? props.placeholder : ''}
                        {...props}
                    />

                    {label && (
                        <label
                            className={cn(
                                'absolute left-4 top-2 text-xs font-medium pointer-events-none transition-colors duration-200',
                                leftIcon ? 'left-10' : '',
                                isFocused
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-gray-600 dark:text-gray-400'
                            )}
                        >
                            {label}
                        </label>
                    )}

                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {rightIcon}
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-1 text-sm text-red-600 dark:text-red-400"
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
