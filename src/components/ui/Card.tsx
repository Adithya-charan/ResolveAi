import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    noPadding?: boolean;
}

export function Card({ className, children, noPadding = false, ...props }: CardProps) {
    return (
        <div
            className={twMerge(
                clsx(
                    'bg-resolve-surface rounded-lg border border-resolve-border shadow-sm',
                    !noPadding && 'p-6',
                    className
                )
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={twMerge(clsx('border-b border-resolve-border px-6 py-4 flex items-center justify-between', className))} {...props}>
            {children}
        </div>
    );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={twMerge(clsx('p-6', className))} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={twMerge(clsx('text-base font-semibold text-resolve-text-primary leading-6', className))} {...props}>
            {children}
        </h3>
    );
}
