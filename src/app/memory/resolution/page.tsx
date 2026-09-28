'use client';

import { Search, BrainCircuit, History, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

type AttemptStatus = 'FAILED' | 'PARTIAL' | 'SUCCESS';

const attempts: { label: string; detail: string; status: AttemptStatus; variant: 'critical' | 'warning' | 'success' }[] = [
    { label: 'Restart Service', detail: 'Service restarted, but connections immediately saturated again. Issue returned in under 2 minutes.', status: 'FAILED', variant: 'critical' },
    { label: 'Increase Timeout', detail: 'Reduced 503s slightly, but latency skyrocketed — P99 peaked at 12s. Not viable.', status: 'PARTIAL', variant: 'warning' },
    { label: 'Rollback & Config Update', detail: 'Rolling back latest release + pool-size config correction restored healthy state immediately.', status: 'SUCCESS', variant: 'success' },
];

const dotColor: Record<AttemptStatus, string> = {
    FAILED: 'bg-resolve-critical border-resolve-critical',
    PARTIAL: 'bg-resolve-warning border-resolve-warning',
    SUCCESS: 'bg-resolve-success border-resolve-success',
};

const cardBg: Record<AttemptStatus, string> = {
    FAILED: 'bg-resolve-critical-light/20 border-resolve-critical/20',
    PARTIAL: 'bg-resolve-warning-light/20 border-resolve-warning/20',
    SUCCESS: 'bg-resolve-success-light/20 border-resolve-success/20',
};

export default function ResolutionMemory() {
    return (
        <div className="space-y-6 pb-12 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-resolve-text-primary tracking-tight flex items-center">
                    <BrainCircuit className="w-6 h-6 mr-3 text-resolve-hindsight" /> Resolution Memory
                </h1>
                <p className="text-sm text-resolve-text-secondary mt-1">
                    Historical journey of incident resolutions. What failed, what worked, and lessons learned.
                </p>
            </div>

            {/* Search */}
            <Card className="p-4 !py-3">
                <div className="relative w-full max-w-xl flex items-center">
                    <Search className="h-4 w-4 text-resolve-text-muted absolute left-3" />
                    <input
                        type="text"
                        placeholder="Search resolutions, symptoms, or lessons learned..."
                        className="w-full pl-9 pr-4 py-2 bg-resolve-surface-secondary border border-resolve-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-resolve-hindsight"
                    />
                </div>
            </Card>

            {/* Resolution entry */}
            <div className="border border-resolve-border bg-white rounded-lg overflow-hidden shadow-sm">
                {/* Entry header */}
                <div className="p-5 border-b border-resolve-border bg-resolve-surface-secondary/40 flex justify-between items-start">
                    <div>
                        <div className="flex items-center space-x-3 mb-2">
                            <span className="font-mono text-sm font-bold text-resolve-text-primary bg-white px-1.5 py-0.5 rounded border border-resolve-border shadow-sm">
                                INC-421
                            </span>
                            <Badge variant="neutral">Payment Service</Badge>
                            <span className="text-xs text-resolve-text-secondary flex items-center">
                                <History className="w-3 h-3 inline mr-1" /> 6 months ago
                            </span>
                        </div>
                        <h2 className="text-lg font-bold text-resolve-text-primary">
                            Database connection pool exhaustion
                        </h2>
                    </div>
                    <Link
                        href="/memory/resolution/INC-421"
                        className="bg-white border border-resolve-border text-resolve-text-primary text-sm font-semibold px-4 py-2 rounded shadow-sm hover:bg-resolve-surface-secondary transition-colors whitespace-nowrap ml-4"
                    >
                        View Detail
                    </Link>
                </div>

                <div className="p-6">
                    {/* Connected resolution attempt timeline */}
                    <div className="relative pl-6 space-y-0 border-l-2 border-resolve-border ml-3 mt-2 mb-6">
                        {attempts.map((attempt, i) => (
                            <div key={attempt.label} className="relative mb-6 last:mb-0">
                                {/* Dot */}
                                <div
                                    className={`absolute -left-[0.95rem] top-3 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 z-10 ${dotColor[attempt.status]}`}
                                />
                                <div className={`rounded-lg border p-4 ${cardBg[attempt.status]} group hover:shadow-sm transition-shadow cursor-default`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold text-resolve-text-primary">
                                            Attempt {i + 1}: {attempt.label}
                                        </span>
                                        <Badge variant={attempt.variant} className="text-[10px] px-1.5 py-0 shrink-0 ml-2">
                                            {attempt.status}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-resolve-text-secondary leading-relaxed">
                                        {attempt.detail}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Lesson Learned — high-visibility insight block */}
                    <div className="bg-gradient-to-r from-[#ECFEFF] to-white border border-resolve-hindsight/30 rounded-lg p-5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-resolve-hindsight rounded-l" />
                        <div className="pl-3">
                            <h4 className="text-xs font-bold text-resolve-hindsight uppercase tracking-wider mb-2 flex items-center">
                                <BrainCircuit className="w-3.5 h-3.5 mr-1.5" />
                                Core Lesson Learned — Organizational Memory
                            </h4>
                            <p className="text-sm font-semibold text-resolve-text-primary leading-relaxed">
                                &ldquo;Restarting the service restores availability temporarily but does not resolve the underlying
                                connection-pool issue. Connection pool configurations must be audited against new transaction volumes
                                after every major traffic event.&rdquo;
                            </p>
                        </div>
                    </div>

                    {/* Related active incident alert */}
                    <div className="mt-4 flex items-start gap-3 bg-resolve-warning-light border border-resolve-warning/30 rounded-lg p-4">
                        <AlertTriangle className="w-5 h-5 text-resolve-warning shrink-0 mt-0.5" />
                        <div>
                            <div className="text-sm font-bold text-resolve-warning mb-1">
                                This lesson may apply to INC-482 — Possible Recurrence Today
                            </div>
                            <Link
                                href="/incidents/INC-482"
                                className="text-xs font-semibold text-resolve-text-primary underline hover:text-resolve-info"
                            >
                                Investigate INC-482 →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
