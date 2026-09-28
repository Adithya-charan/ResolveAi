'use client';

import { ShieldCheck, ArrowDown, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const verificationSteps = [
    { label: 'Permanent Remediation Applied', status: 'remediation', date: 'Oct 12', note: 'PR #8821 merged — connection-pool monitoring + config correction' },
    { label: 'Day 1 Verification', status: 'healthy', date: 'Oct 13', note: 'Error rate 0.01% — well within SLO thresholds' },
    { label: 'Day 30 Verification', status: 'healthy', date: 'Nov 12', note: 'Stable under seasonal traffic uplift. No connection saturation.' },
    { label: 'Day 90 Verification', status: 'healthy', date: 'Jan 10', note: 'Quarterly review passed. Monitoring agent reporting healthy pool.' },
    { label: 'Day 147 Verification', status: 'healthy', date: 'Mar 8', note: 'Post-holiday review completed. All checks green.' },
    { label: 'Today — Current Status', status: 'recurrence', date: 'Today', note: 'INC-482 shows 87% similar symptom pattern. Possible recurrence.' },
];

const statusConfig = {
    remediation: {
        icon: ShieldCheck,
        dotColor: 'bg-resolve-info',
        lineColor: 'border-resolve-info',
        label: 'REMEDIATION',
        labelColor: 'text-resolve-info',
        bg: 'bg-resolve-info-light border-resolve-info/30',
    },
    healthy: {
        icon: CheckCircle2,
        dotColor: 'bg-resolve-success',
        lineColor: 'border-resolve-success',
        label: 'HEALTHY',
        labelColor: 'text-resolve-success',
        bg: 'bg-resolve-success-light/30 border-resolve-success/20',
    },
    recurrence: {
        icon: AlertTriangle,
        dotColor: 'bg-resolve-warning',
        lineColor: 'border-resolve-warning',
        label: 'POSSIBLE RECURRENCE',
        labelColor: 'text-resolve-warning',
        bg: 'bg-resolve-warning-light border-resolve-warning/40',
    },
};

export default function RemediationMemory() {
    return (
        <div className="space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-resolve-text-primary tracking-tight flex items-center">
                    <ShieldCheck className="w-6 h-6 mr-3 text-resolve-hindsight" /> Remediation Memory
                </h1>
                <p className="text-sm text-resolve-text-secondary mt-1">
                    Verification of permanent fixes and long-term preventative measures.
                </p>
            </div>

            {/* Item 1: Full lifecycle with recurrence */}
            <Card className="overflow-hidden border-l-4 border-l-resolve-warning shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-resolve-border pb-4 mb-8">
                    <div>
                        <div className="text-xs font-bold text-resolve-text-muted uppercase tracking-wider mb-2">
                            Original Incident
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="font-mono text-sm font-bold text-resolve-text-primary bg-resolve-surface-secondary px-2 py-1 rounded border border-resolve-border">
                                INC-421
                            </span>
                            <Badge variant="neutral">Payment Service</Badge>
                            <span className="text-sm font-bold text-resolve-text-primary ml-2">
                                Database connection pool exhaustion
                            </span>
                        </div>
                    </div>
                    <div className="text-xs font-medium text-resolve-text-secondary text-right">
                        <div>Original: Oct 12</div>
                        <div className="text-resolve-warning font-bold mt-1">Recurrence: Today</div>
                    </div>
                </div>

                {/* Polished vertical verification timeline */}
                <div className="relative max-w-2xl mx-auto">
                    {/* Connecting line — full height behind dots */}
                    <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-resolve-border" />

                    <ol className="relative space-y-0" aria-label="Remediation verification timeline">
                        {verificationSteps.map((step, i) => {
                            const cfg = statusConfig[step.status as keyof typeof statusConfig];
                            const Icon = cfg.icon;
                            const isLast = i === verificationSteps.length - 1;
                            return (
                                <li key={step.label} className="relative flex items-start pl-10 pb-6">
                                    {/* Dot */}
                                    <div
                                        className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 ${cfg.dotColor}`}
                                        aria-hidden="true"
                                    >
                                        <Icon className="w-4 h-4 text-white" />
                                    </div>

                                    {/* Content */}
                                    <div
                                        className={`w-full rounded-lg border p-4 ${cfg.bg} ${isLast ? 'ring-2 ring-resolve-warning/20' : ''}`}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.labelColor}`}>
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <span className="text-xs font-semibold text-resolve-text-muted">{step.date}</span>
                                        </div>
                                        <div className="font-semibold text-resolve-text-primary text-sm mb-1">{step.label}</div>
                                        <p className="text-xs text-resolve-text-secondary leading-relaxed">{step.note}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </div>

                {/* Recurrence Alert Banner */}
                <div className="bg-resolve-warning-light border-t border-resolve-warning/40 p-5 flex items-start space-x-3 mt-4 -mx-6 -mb-6 rounded-b-lg">
                    <AlertTriangle className="w-6 h-6 text-resolve-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-resolve-warning mb-1 uppercase tracking-wider">
                            Possible Recurrence Detected Today
                        </h4>
                        <p className="text-sm font-medium text-resolve-text-primary">
                            Previous remediation may not have prevented the underlying failure from recurring. Current active{' '}
                            <Link href="/incidents/INC-482" className="underline font-bold text-resolve-text-primary hover:text-resolve-info">
                                INC-482
                            </Link>{' '}
                            is showing 87% similar symptoms to the original failure state.
                        </p>
                        <p className="text-xs text-resolve-text-secondary mt-2">
                            Note: Similarity alone does not confirm recurrence. Review evidence before concluding root-cause match.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
