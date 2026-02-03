import React, { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'gradient' | 'modern';
    hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', hover = true, children, ...props }, ref) => {
        const { onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, ...restProps } = props;
        
        const variants = {
            default:
                'bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 shadow-modern',
            glass:
                'glass-card',
            gradient:
                'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border border-blue-200/60 dark:border-purple-800/60 shadow-modern',
            modern:
                'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-modern-lg',
        };

        return (
            <motion.div
                ref={ref}
                className={cn('rounded-3xl p-6 transition-all duration-300', variants[variant], className)}
                whileHover={hover ? { y: -8, scale: 1.02, boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15)' } : {}}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                {...restProps}
            >
                {children}
            </motion.div>
        );
    }
);

Card.displayName = 'Card';

export default Card;
