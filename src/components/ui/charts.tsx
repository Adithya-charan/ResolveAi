'use client';

import React, { useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import type { IncidentListItem } from '@/types/incidents';

/* ─── util ─────────────────────────────────────────────────────────── */
function fmtDate(iso: string) {
    try {
        return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return iso; }
}

/* ─── Incident Trend Chart ─────────────────────────────────────────── */
interface TrendChartProps { incidents: IncidentListItem[]; loading?: boolean; }

export function IncidentTrendChart({ incidents, loading }: TrendChartProps) {
    const data = useMemo(() => {
        if (!incidents.length) return [];
        // Bucket by calendar day
        const buckets: Record<string, { date: string; total: number; critical: number; resolved: number }> = {};
        for (const inc of incidents) {
            const key = fmtDate(inc.opened_at);
            if (!buckets[key]) buckets[key] = { date: key, total: 0, critical: 0, resolved: 0 };
            buckets[key].total += 1;
            if (inc.severity === 'critical' || inc.severity === 'high') buckets[key].critical += 1;
            if (inc.status === 'resolved' || inc.status === 'closed') buckets[key].resolved += 1;
        }
        return Object.values(buckets).sort((a, b) => a.date < b.date ? -1 : 1);
    }, [incidents]);

    if (loading) return <div className="h-64 mt-4 bg-slate-50 rounded animate-pulse" />;

    if (!data.length) {
        return (
            <div className="h-64 flex items-center justify-center mt-4">
                <p className="text-sm text-resolve-text-muted">No incident data available for trend analysis.</p>
            </div>
        );
    }

    // If only one data point, recharts can't draw a line — duplicate it with a note
    const chartData = data.length === 1 ? [data[0], { ...data[0], date: `${data[0].date} ·` }] : data;

    return (
        <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#475569" stopOpacity={0.12} />
                            <stop offset="95%" stopColor="#475569" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gCritical" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#DC2626" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#16A34A" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                        labelStyle={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="total" name="Total" stroke="#475569" strokeWidth={2} fill="url(#gTotal)" />
                    <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#16A34A" strokeWidth={2} fill="url(#gResolved)" />
                    <Area type="monotone" dataKey="critical" name="Critical" stroke="#DC2626" strokeWidth={2} fill="url(#gCritical)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ─── Resolution Outcome Chart ─────────────────────────────────────── */
export function ResolutionOutcomeChart({ incidents, loading }: TrendChartProps) {
    const data = useMemo(() => {
        // Group by service, count attempt outcomes where possible
        const svcMap: Record<string, { name: string; Resolved: number; Active: number }> = {};
        for (const inc of incidents) {
            const svc = inc.service?.name ?? 'Unknown';
            if (!svcMap[svc]) svcMap[svc] = { name: svc, Resolved: 0, Active: 0 };
            if (inc.status === 'resolved' || inc.status === 'closed') svcMap[svc].Resolved += 1;
            else svcMap[svc].Active += 1;
        }
        return Object.values(svcMap).slice(0, 5); // cap at 5 services
    }, [incidents]);

    if (loading) return <div className="h-64 mt-4 bg-slate-50 rounded animate-pulse" />;

    if (!data.length) {
        return (
            <div className="h-64 flex items-center justify-center mt-4">
                <p className="text-sm text-resolve-text-muted">No incident data available.</p>
            </div>
        );
    }

    return (
        <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }} dx={-6} width={90} />
                    <Tooltip
                        cursor={{ fill: '#F8FAFC' }}
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                    />
                    <Legend align="left" verticalAlign="top" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <Bar dataKey="Resolved" stackId="a" fill="#16A34A" radius={[4, 0, 0, 4]} barSize={22} />
                    <Bar dataKey="Active" stackId="a" fill="#DC2626" radius={[0, 4, 4, 0]} barSize={22} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ─── Severity Distribution ────────────────────────────────────────── */
interface SeverityChartProps { incidents: IncidentListItem[]; loading?: boolean; }

export function SeverityDistributionChart({ incidents, loading }: SeverityChartProps) {
    const segments = useMemo(() => {
        const counts = { critical: 0, high: 0, medium: 0, low: 0 };
        for (const inc of incidents) {
            const s = inc.severity as keyof typeof counts;
            if (s in counts) counts[s] += 1;
        }
        const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
        return [
            { name: 'Critical', value: counts.critical + counts.high, color: '#DC2626' },
            { name: 'Medium', value: counts.medium, color: '#D97706' },
            { name: 'Low', value: counts.low, color: '#16A34A' },
        ].filter(s => s.value > 0).map(s => ({ ...s, pct: s.value / total }));
    }, [incidents]);

    if (loading) return <div className="h-12 bg-slate-100 rounded animate-pulse mt-4" />;

    if (!segments.length) {
        return <div className="h-12 mt-4 bg-slate-50 rounded flex items-center justify-center text-xs text-slate-400">No incident data</div>;
    }

    return (
        <div className="flex h-12 w-full mt-4 rounded-md overflow-hidden bg-resolve-surface-secondary border border-resolve-border">
            {segments.map(seg => (
                <div
                    key={seg.name}
                    className="h-full flex items-center justify-center group overflow-hidden relative cursor-help"
                    style={{ width: `${seg.pct * 100}%`, backgroundColor: seg.color }}
                    title={`${seg.name}: ${seg.value}`}
                >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-white font-bold text-xs tracking-wider opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
                        {seg.value} {seg.name}
                    </span>
                </div>
            ))}
        </div>
    );
}
