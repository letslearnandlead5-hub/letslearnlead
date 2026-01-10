import React from 'react';
import { cn } from '../../utils/helpers';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
}

const Skeleton: React.FC<SkeletonProps> = ({
    className,
    variant = 'rectangular',
}) => {
    const variants = {
        text: 'h-4 w-full',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    return (
        <div
            className={cn(
                'shimmer bg-gray-200 dark:bg-gray-800',
                variants[variant],
                className
            )}
        />
    );
};

export default Skeleton;
