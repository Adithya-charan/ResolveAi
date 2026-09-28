import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

type BadgeVariant = 'critical' | 'warning' | 'success' | 'info' | 'hindsight' | 'neutral';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
    critical: 'bg-resolve-critical-light text-resolve-critical border border-resolve-critical/20',
    warning: 'bg-resolve-warning-light text-resolve-warning border border-resolve-warning/20',
    success: 'bg-resolve-success-light text-resolve-success border border-resolve-success/20',
    info: 'bg-resolve-info-light text-resolve-info border border-resolve-info/20',
    hindsight: 'bg-resolve-hindsight-light text-resolve-hindsight border border-resolve-hindsight/20',
    neutral: 'bg-resolve-surface-secondary text-resolve-text-secondary border border-resolve-border',
};

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
    return (
        <span
            className={twMerge(
                clsx(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
                    variantStyles[variant],
                    className
                )
            )}
            {...props}
        >
            {children}
        </span>
    );
}
