import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'rectangle' | 'circle' | 'text';
    width?: string | number;
    height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'rectangle',
    width,
    height
}) => {
    const baseStyles = "animate-pulse bg-slate-200 dark:bg-slate-700";

    const variantStyles = {
        rectangle: "rounded-lg",
        circle: "rounded-full",
        text: "rounded h-4 w-full"
    };

    const style: React.CSSProperties = {
        width: width,
        height: height,
    };

    return (
        <div
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
            style={style}
        />
    );
};

export default Skeleton;
