import React, { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        const baseStyles =
            'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

        const variants = {
            primary:
                'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg hover:shadow-xl focus:ring-primary-500',
            secondary:
                'bg-secondary-600 hover:bg-secondary-700 text-white shadow-lg hover:shadow-xl focus:ring-secondary-500',
            outline:
                'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950 focus:ring-primary-500',
            ghost:
                'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500',
            danger:
                'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl focus:ring-red-500',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm rounded-lg',
            md: 'px-5 py-2.5 text-base rounded-xl',
            lg: 'px-7 py-3.5 text-lg rounded-2xl',
        };

        const { onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, ...restProps } = props;
        
        return (
            <motion.button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={disabled || isLoading}
                whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
                whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
                {...restProps}
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : leftIcon ? (
                    <span className="mr-2">{leftIcon}</span>
                ) : null}

                {children}

                {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
