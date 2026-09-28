'use client';

import { TrendingUp, ArrowRight, LayoutGrid, List, Component, AlertCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const PATTERNS = [
    {
        id: 'PTN-001',
        name: 'Database Connection Exhaustion',
        incidents: 7,
        services: 3,
        remediationAttempts: 2,
        risk: 'HIGH' as const,
        trend: 'increasing',
        lastSeen: 'Today (INC-482)',
        recentServices: ['Payment Service', 'Order Service', 'Billing Service'],
    },
    {
        id: 'PTN-002',
        name: 'Third-party API Timeout Waterfall',
        incidents: 4,
        services: 2,
        remediationAttempts: 1,
        risk: 'MEDIUM' as const,
        trend: 'stable',
        lastSeen: '14 days ago',
        recentServices: ['Checkout API', 'Shipping Service'],
    },
    {
        id: 'PTN-003',
        name: 'Redis Cache Eviction Storm',
        incidents: 2,
        services: 1,
        remediationAttempts: 1,
        risk: 'LOW' as const,
        trend: 'decreasing',
        lastSeen: '2 months ago',
        recentServices: ['Auth Service'],
    },
];

const riskVariant = {
    HIGH: 'critical',
    MEDIUM: 'warning',
    LOW: 'success',
} as const;

export default function RecurrencePatterns() {
    return (
        <div className="space-y-6 animate-fade-in fade-in-0 duration-500 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-resolve-text-primary tracking-tight">Recurrence Patterns</h1>
                    <p className="text-sm text-resolve-text-secondary mt-1">
                        Organizational learning and systemic risk identification.
                    </p>
                </div>
                <div className="flex bg-white border border-resolve-border rounded-md p-1 shadow-sm">
                    <button
                        className="px-2 py-1 bg-resolve-surface-secondary shadow-sm border border-resolve-border/50 rounded flex items-center justify-center text-resolve-text-primary"
                        aria-label="Grid view"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        className="px-2 py-1 text-resolve-text-muted hover:text-resolve-text-primary transition-colors flex items-center justify-center"
                        aria-label="List view"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {PATTERNS.map((ptn) => (
                    <Card
                        key={ptn.id}
                        className="flex flex-col h-full group hover:shadow-md transition-shadow relative overflow-hidden shadow-sm"
                    >
                        {ptn.risk === 'HIGH' && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-resolve-critical" />
                        )}

                        <div className="flex justify-between items-start mb-6">
                            <Badge variant={riskVariant[ptn.risk]}>{ptn.risk} RISK</Badge>
                            <span className="font-mono text-xs font-bold text-resolve-text-muted uppercase tracking-wider">
                                {ptn.id}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-resolve-text-primary mb-6 pr-4">{ptn.name}</h3>

                        {/* Relationship visualization: Pattern → Services → Incidents → Remediation */}
                        <div className="flex-1 bg-resolve-surface-secondary/50 rounded border border-resolve-border p-4 mb-6">
                            <div className="space-y-0">
                                {/* Services layer */}
                                <div className="flex items-start">
                                    <div className="flex flex-col items-center mr-3">
                                        <div className="bg-white border border-resolve-border p-1.5 rounded text-resolve-text-secondary shadow-sm z-10">
                                            <Component className="w-4 h-4" />
                                        </div>
                                        <div className="w-px flex-1 bg-resolve-border min-h-[20px]" />
                                    </div>
                                    <div className="pt-0.5 pb-4">
                                        <div className="text-[10px] uppercase font-bold tracking-wider text-resolve-text-muted mb-0.5">
                                            Impact Radius
                                        </div>
                                        <div className="font-semibold text-resolve-text-primary text-sm">
                                            {ptn.services} Services Affected
                                        </div>
                                        <div className="text-xs text-resolve-text-secondary mt-0.5">
                                            {ptn.recentServices.join(', ')}
                                        </div>
                                    </div>
                                </div>

                                {/* Incidents layer */}
                                <div className="flex items-start">
                                    <div className="flex flex-col items-center mr-3">
                                        <div className="bg-white border border-resolve-border p-1.5 rounded text-resolve-text-secondary shadow-sm z-10">
                                            <AlertCircle className="w-4 h-4" />
                                        </div>
                                        <div className="w-px flex-1 bg-resolve-border min-h-[20px]" />
                                    </div>
                                    <div className="pt-0.5 pb-4">
                                        <div className="text-[10px] uppercase font-bold tracking-wider text-resolve-text-muted mb-0.5">
                                            Incident Volume
                                        </div>
                                        <div className="font-semibold text-resolve-text-primary text-sm">
                                            {ptn.incidents} Historical Incidents
                                        </div>
                                        <div className="text-xs text-resolve-text-secondary mt-0.5">Last seen: {ptn.lastSeen}</div>
                                    </div>
                                </div>

                                {/* Remediation layer */}
                                <div className="flex items-start">
                                    <div className="flex flex-col items-center mr-3">
                                        <div className="bg-white border border-resolve-border p-1.5 rounded text-resolve-hindsight shadow-sm z-10">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="pt-0.5">
                                        <div className="text-[10px] uppercase font-bold tracking-wider text-resolve-hindsight mb-0.5">
                                            Organizational Memory
                                        </div>
                                        <div className="font-semibold text-resolve-text-primary text-sm">
                                            {ptn.remediationAttempts} Remediation Intervention{ptn.remediationAttempts !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-resolve-border flex justify-between items-center mt-auto">
                            {ptn.trend === 'increasing' ? (
                                <div className="flex items-center text-xs font-bold text-resolve-critical uppercase tracking-wider">
                                    <TrendingUp className="w-4 h-4 mr-1.5" /> Trend Increasing
                                </div>
                            ) : (
                                <div className="text-xs font-semibold text-resolve-text-secondary uppercase tracking-wider">
                                    {ptn.trend === 'stable' ? 'Trend Stable' : 'Trend Decreasing'}
                                </div>
                            )}

                            <Link
                                href={`/patterns/${ptn.id}`}
                                className="text-sm font-semibold text-resolve-text-primary bg-white border border-resolve-border rounded px-3 py-1.5 hover:bg-resolve-surface-secondary shadow-sm transition-colors flex items-center"
                            >
                                View Intelligence <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                            </Link>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
