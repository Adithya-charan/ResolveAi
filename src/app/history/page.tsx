'use client';

import { Search, Filter, Database, Server, Calendar, Download } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const MOCK_HISTORY = [
    { id: 'INC-421', service: 'Payment Service', severity: 'critical', cause: 'DB Connection Pool', resolution: 'Rollback & Config Update', duration: '45m', status: 'resolved', recurrence: 'yes', date: 'Oct 12' },
    { id: 'INC-410', service: 'Auth Service', severity: 'warning', cause: 'Token Expiry Sync', resolution: 'Service Restart', duration: '12m', status: 'resolved', recurrence: 'no', date: 'Oct 05' },
    { id: 'INC-398', service: 'Checkout API', severity: 'critical', cause: 'Upstream Latency', resolution: 'Circuit Breaker Toggled', duration: '1h 20m', status: 'resolved', recurrence: 'investigating', date: 'Sep 28' },
    { id: 'INC-385', service: 'Payment Service', severity: 'warning', cause: 'DB Index Fragmentation', resolution: 'Index Rebuild', duration: '2h 10m', status: 'resolved', recurrence: 'no', date: 'Sep 15' },
];

export default function IncidentHistory() {
    return (
        <div className="space-y-6 animate-fade-in fade-in-0 duration-500 flex flex-col h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-resolve-text-primary tracking-tight">Incident History</h1>
                    <p className="text-sm text-resolve-text-secondary mt-1">Review past incidents and their resolutions.</p>
                </div>
                <button className="flex items-center px-3 py-2 bg-white border border-resolve-border rounded-md text-sm font-medium text-resolve-text-secondary hover:bg-resolve-surface-secondary transition-colors">
                    <Download className="w-4 h-4 mr-2" /> Export
                </button>
            </div>

            <Card className="flex flex-col flex-1 min-h-0 overflow-hidden" noPadding>
                <div className="p-4 border-b border-resolve-border flex flex-col sm:flex-row gap-4 justify-between bg-resolve-surface">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-resolve-text-muted" />
                        <input
                            type="text"
                            placeholder="Search history..."
                            className="w-full pl-9 pr-4 py-2 bg-resolve-surface:secondary border border-resolve-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-resolve-hindsight"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-resolve-surface border border-resolve-border rounded text-sm text-resolve-text-secondary hover:bg-resolve-surface-secondary flex items-center"><Calendar className="w-4 h-4 mr-1.5" /> Date Range</button>
                        <button className="px-3 py-1.5 bg-resolve-surface border border-resolve-border rounded text-sm text-resolve-text-secondary hover:bg-resolve-surface-secondary flex items-center"><Filter className="w-4 h-4 mr-1.5" /> Filters</button>
                    </div>
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-sm text-resolve-text-secondary whitespace-nowrap">
                        <thead className="bg-resolve-surface-secondary text-xs uppercase text-resolve-text-muted font-bold tracking-wider sticky top-0 border-b border-resolve-border z-10">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Incident ID</th>
                                <th className="px-6 py-4 font-semibold">Service</th>
                                <th className="px-6 py-4 font-semibold">Severity</th>
                                <th className="px-6 py-4 font-semibold">Root Cause</th>
                                <th className="px-6 py-4 font-semibold">Resolution</th>
                                <th className="px-6 py-4 font-semibold">Duration</th>
                                <th className="px-6 py-4 font-semibold">Recurrence</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-resolve-border bg-white">
                            {MOCK_HISTORY.map((inc) => (
                                <tr key={inc.id} className="hover:bg-resolve-surface-secondary/50 transition-colors cursor-pointer group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-mono font-bold text-resolve-text-primary group-hover:text-resolve-info transition-colors">{inc.id}</span>
                                            <span className="text-xs text-resolve-text-muted mt-0.5">{inc.date}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-resolve-text-primary flex items-center mt-2.5">
                                        {inc.service.includes('DB') || inc.service.includes('Payment') ? <Database className="w-3.5 h-3.5 mr-1.5 text-resolve-text-muted" /> : <Server className="w-3.5 h-3.5 mr-1.5 text-resolve-text-muted" />}
                                        {inc.service}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={inc.severity as "critical" | "warning" | "success" | "neutral" | "info" | "hindsight"}>{inc.severity}</Badge>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-resolve-text-primary max-w-[200px] truncate" title={inc.cause}>
                                        {inc.cause}
                                    </td>
                                    <td className="px-6 py-4 max-w-[200px] truncate" title={inc.resolution}>
                                        {inc.resolution}
                                    </td>
                                    <td className="px-6 py-4">
                                        {inc.duration}
                                    </td>
                                    <td className="px-6 py-4">
                                        {inc.recurrence === 'yes' ? (
                                            <Badge variant="warning" className="bg-resolve-warning-light text-resolve-warning border-resolve-warning/30">DETECTED</Badge>
                                        ) : inc.recurrence === 'investigating' ? (
                                            <span className="text-xs font-semibold text-resolve-text-muted">EVALUATING</span>
                                        ) : (
                                            <span className="text-xs font-semibold text-resolve-success flex items-center">NO</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-resolve-border bg-resolve-surface flex items-center justify-between">
                    <span className="text-xs text-resolve-text-secondary">Showing 4 of 248 incidents</span>
                    <div className="flex space-x-1">
                        <button className="px-2 py-1 border border-resolve-border rounded text-xs text-resolve-text-muted disabled:opacity-50">Prev</button>
                        <button className="px-2 py-1 border border-resolve-border bg-resolve-surface-secondary text-resolve-text-primary font-medium rounded text-xs">1</button>
                        <button className="px-2 py-1 border border-resolve-border rounded text-xs text-resolve-text-muted">2</button>
                        <button className="px-2 py-1 border border-resolve-border rounded text-xs text-resolve-text-muted">3</button>
                        <button className="px-2 py-1 border border-resolve-border rounded text-xs text-resolve-text-muted disabled:opacity-50">Next</button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
