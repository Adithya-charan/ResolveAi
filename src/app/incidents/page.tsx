'use client';

import { Search, Filter, SlidersHorizontal, ChevronDown, Check, Activity, ShieldAlert, Cpu } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const PREVIEW_INCIDENTS = [
    {
        id: 'INC-482',
        service: 'Payment Service',
        severity: 'critical',
        symptom: '503 errors ↑42%',
        started: '14:32',
        status: 'investigating',
        hindsightMatch: 87,
        recurrenceRisk: 'HIGH'
    },
    {
        id: 'INC-481',
        service: 'Auth Service',
        severity: 'warning',
        symptom: 'Latency > 2s on /verify',
        started: '12:15',
        status: 'monitoring',
        hindsightMatch: null,
        recurrenceRisk: 'LOW'
    }
];

export default function ActiveIncidents() {
    return (
        <div className="space-y-6 animate-fade-in fade-in-0 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-resolve-text-primary tracking-tight">Active Incidents</h1>
                    <p className="text-sm text-resolve-text-secondary mt-1">Real-time operational alerts.</p>
                </div>
            </div>

            {/* Toolbar */}
            <Card className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 !py-3 bg-white">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-resolve-text-muted" />
                    <input
                        type="text"
                        placeholder="Search incident ID, service or symptoms..."
                        className="w-full pl-9 pr-4 py-2 bg-resolve-surface-secondary border border-resolve-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-resolve-hindsight"
                    />
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button className="flex items-center px-3 py-2 bg-white border border-resolve-border rounded-md text-sm font-medium text-resolve-text-secondary hover:bg-resolve-surface-secondary transition-colors">
                        <Filter className="w-4 h-4 mr-2" /> Severity <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
                    </button>
                    <button className="flex items-center px-3 py-2 bg-white border border-resolve-border rounded-md text-sm font-medium text-resolve-text-secondary hover:bg-resolve-surface-secondary transition-colors">
                        <Cpu className="w-4 h-4 mr-2" /> Service <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
                    </button>
                    <button className="flex items-center px-3 py-2 bg-white border border-resolve-border rounded-md text-sm font-medium text-resolve-text-secondary hover:bg-resolve-surface-secondary transition-colors">
                        <SlidersHorizontal className="w-4 h-4 mr-2" /> Views
                    </button>
                </div>
            </Card>

            {/* Incident List */}
            <div className="space-y-3">
                {PREVIEW_INCIDENTS.map((inc) => (
                    <Card key={inc.id} noPadding className="hover:border-resolve-text-muted transition-colors group overflow-hidden">
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                            <div className="flex items-start sm:items-center gap-4">
                                <div className={`w-1.5 self-stretch rounded-full ${inc.severity === 'critical' ? 'bg-resolve-critical' : 'bg-resolve-warning'}`}></div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                        <span className="font-mono text-sm font-bold text-resolve-text-primary bg-resolve-surface-secondary px-1.5 py-0.5 rounded">{inc.id}</span>
                                        <Badge variant={inc.severity as "critical" | "warning" | "success" | "neutral" | "info" | "hindsight"}>{inc.severity.toUpperCase()}</Badge>
                                        <span className="text-sm font-medium text-resolve-text-secondary flex items-center">
                                            <Cpu className="w-3.5 h-3.5 mr-1" /> {inc.service}
                                        </span>
                                        <span className="text-xs text-resolve-text-muted ml-2">Started {inc.started}</span>
                                    </div>
                                    <h3 className="text-base font-bold text-resolve-text-primary">{inc.symptom}</h3>
                                </div>
                            </div>

                            <div className="flex items-center flex-wrap gap-4 sm:gap-8 ml-6 sm:ml-0">
                                {inc.hindsightMatch && (
                                    <div className="flex flex-col space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-resolve-text-muted tracking-wider">Historical Match</span>
                                        <Badge variant="hindsight" className="!bg-resolve-hindsight !text-white text-xs">{inc.hindsightMatch}% Similarity</Badge>
                                    </div>
                                )}
                                {inc.recurrenceRisk === 'HIGH' && (
                                    <div className="flex flex-col space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-resolve-text-muted tracking-wider">Recurrence Risk</span>
                                        <Badge variant="warning" className="text-xs bg-resolve-warning/10 text-resolve-warning"><ShieldAlert className="w-3 h-3 mr-1" /> HIGH</Badge>
                                    </div>
                                )}

                                <div className="flex flex-col space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-resolve-text-muted tracking-wider">Status</span>
                                    <div className="flex items-center text-sm font-medium text-resolve-text-secondary capitalize">
                                        {inc.status === 'investigating' && <Activity className="w-3.5 h-3.5 mr-1.5 text-blue-500 animate-pulse" />}
                                        {inc.status}
                                    </div>
                                </div>

                                <Link
                                    href={`/incidents/${inc.id}`}
                                    className="inline-flex items-center justify-center rounded-md bg-resolve-surface-secondary px-3 py-1.5 text-sm font-semibold text-resolve-text-primary border border-resolve-border shadow-sm hover:bg-resolve-hindsight hover:text-white hover:border-resolve-hindsight transition-all"
                                >
                                    Investigate
                                </Link>
                            </div>

                        </div>
                    </Card>
                ))}
            </div>

        </div>
    );
}
