import React, { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'gradient';
    hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', hover = true, children, ...props }, ref) => {
        const { onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, ...restProps } = props;
        
        const variants = {
            default:
                'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg',
            glass:
                'glass-card',
            gradient:
                'bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border border-primary-200 dark:border-primary-800',
        };

        return (
            <motion.div
                ref={ref}
                className={cn('rounded-2xl p-6 transition-all duration-300', variants[variant], className)}
                whileHover={hover ? { y: -5, boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)' } : {}}
                {...restProps}
            >
                {children}
            </motion.div>
        );
    }
);

Card.displayName = 'Card';

export default Card;
