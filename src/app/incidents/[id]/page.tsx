'use client';

import {
    Activity, AlertTriangle, ArrowRight, BrainCircuit, CheckCircle2,
    Clock, Database, MessageSquare, Play, RefreshCw, TrendingUp, Shield, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, ReferenceLine
} from 'recharts';
import { incidentsApi } from '@/lib/api/incidents';
import { memoryApi } from '@/lib/api/memory';
import type { IncidentAnalysisResponse, CopilotResponse } from '@/types/incidents';

const errorRateData = [
    { t: '14:00', rate: 0.8, pool: 62 },
    { t: '14:10', rate: 1.2, pool: 71 },
    { t: '14:20', rate: 3.4, pool: 88 },
    { t: '14:32', rate: 18.0, pool: 100 },
    { t: '14:40', rate: 38.0, pool: 100 },
    { t: '14:50', rate: 42.4, pool: 100 },
    { t: '15:00', rate: 42.1, pool: 100 },
];

const TABS = ['Investigate', 'Timeline', 'Metrics'];

export default function IncidentDetail() {
    const params = useParams();
    const id = params.id as string;
    const [activeTab, setActiveTab] = useState('Investigate');
    const [copilotOpen, setCopilotOpen] = useState(true);
    const [copilotInput, setCopilotInput] = useState('');
    const [copilotMessages, setCopilotMessages] = useState<{ role: 'user' | 'ai'; text: string; source?: string; memory_used?: boolean }[]>([
        { role: 'ai', text: 'Context loaded. I have access to organizational memory for this incident. Ask me anything.' }
    ]);
    const [copilotLoading, setCopilotLoading] = useState(false);

    // Analysis state
    const [analysis, setAnalysis] = useState<IncidentAnalysisResponse | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    // Remediation state from DB
    const [remediationData, setRemediationData] = useState<{
        remediations: Array<{ action: string; detail?: string; status: string }>;
        verification_events: Array<{ label: string; status: string; description?: string }>;
    } | null>(null);

    // Load remediation/verification from DB for INC-421
    useEffect(() => {
        if (id === 'INC-482') {
            incidentsApi.getRemediation('INC-421')
                .then(data => setRemediationData(data as typeof remediationData))
                .catch(() => {
                    // Graceful fallback — show static data
                    setRemediationData({
                        remediations: [{
                            action: 'Connection-pool monitoring + configuration correction (PR #8821)',
                            status: 'verified',
                        }],
                        verification_events: [
                            { label: 'Day 1', status: 'healthy', description: 'Post-remediation check — healthy' },
                            { label: 'Day 30', status: 'healthy', description: '30-day stability check' },
                            { label: 'Day 90', status: 'healthy', description: '90-day verification' },
                            { label: 'Day 147', status: 'healthy', description: '147-day verification' },
                        ],
                    });
                });
        }
    }, [id]);

    async function runAnalysis() {
        setAnalyzing(true);
        setAnalysisError(null);
        try {
            const result = await incidentsApi.analyze({
                incident_number: id,
                title: '503 errors ↑42% on Checkout API',
                description: '503 errors began at 14:32. Error rate escalated to 42.4%. DB connection pool at 100% saturation.',
                severity: 'critical',
                service_name: 'Payment Service',
            });
            setAnalysis(result);

            // Add analysis result to copilot context
            if (result.analysis_status === 'complete' && result.analysis_reasoning) {
                setCopilotMessages(prev => [
                    ...prev,
                    {
                        role: 'ai',
                        text: `Analysis complete. ${result.analysis_reasoning}`,
                        source: result.raw_memory_count > 0
                            ? `Hindsight recalled ${result.raw_memory_count} relevant memories`
                            : 'Based on structured DB history',
                        memory_used: result.raw_memory_count > 0,
                    }
                ]);
            }
        } catch (err) {
            setAnalysisError('Analysis failed. Backend may be unavailable.');
        } finally {
            setAnalyzing(false);
        }
    }

    async function handleCopilotSend(text?: string) {
        const msg = text ?? copilotInput;
        if (!msg.trim()) return;
        setCopilotInput('');
        setCopilotLoading(true);

        setCopilotMessages(prev => [...prev, { role: 'user', text: msg }]);

        try {
            const resp = await memoryApi.askCopilot({
                incident_number: id,
                question: msg,
                context: analysis ? {
                    title: analysis.title,
                    service: analysis.service,
                    severity: analysis.severity,
                    root_cause_hypotheses: analysis.root_cause_hypotheses,
                } : undefined,
            });

            setCopilotMessages(prev => [
                ...prev,
                {
                    role: 'ai',
                    text: resp.answer,
                    source: resp.sources.join(' · ') || undefined,
                    memory_used: resp.memory_used,
                }
            ]);
        } catch {
            setCopilotMessages(prev => [
                ...prev,
                {
                    role: 'ai',
                    text: 'AI analysis is currently unavailable. Please review the historical evidence panel for context.',
                }
            ]);
        } finally {
            setCopilotLoading(false);
        }
    }

    const verificationPoints = remediationData?.verification_events ?? [
        { label: 'Day 1', status: 'healthy' },
        { label: 'Day 30', status: 'healthy' },
        { label: 'Day 90', status: 'healthy' },
        { label: 'Day 147', status: 'healthy' },
    ];

    return (
        <div className="space-y-6 pb-64 lg:pb-8">
            {/* ── Header ── */}
            <div className="bg-white border border-resolve-border rounded-lg p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-base font-bold text-resolve-text-primary px-2 py-1 bg-resolve-surface-secondary rounded border border-resolve-border">
                            {id}
                        </span>
                        <Badge variant="critical">CRITICAL</Badge>
                        <span className="text-resolve-text-secondary text-sm flex items-center">
                            <Database className="w-4 h-4 mr-1.5" /> Payment Service
                        </span>
                        <span className="text-resolve-text-secondary text-sm flex items-center pl-2 border-l border-resolve-border">
                            <Clock className="w-4 h-4 mr-1.5" /> Started 14:32 (45m ago)
                        </span>
                    </div>
                    <h1 className="text-xl font-bold text-resolve-text-primary">503 errors ↑42% — Checkout API</h1>
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex items-center text-xs font-semibold text-resolve-text-secondary bg-resolve-surface-secondary border border-resolve-border rounded-full px-3 py-1.5">
                        <RefreshCw className="w-3 h-3 mr-1.5 text-resolve-info animate-spin" style={{ animationDuration: '2s' }} />
                        Investigating
                    </span>
                    <button
                        onClick={runAnalysis}
                        disabled={analyzing}
                        className="bg-resolve-hindsight text-white text-sm font-semibold px-4 py-2 rounded-md shadow-sm hover:bg-resolve-hindsight/90 transition-colors flex items-center gap-2 disabled:opacity-60"
                    >
                        {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                        {analyzing ? 'Analyzing...' : 'Analyze with Hindsight'}
                    </button>
                </div>
            </div>

            {/* Analysis error */}
            {analysisError && (
                <div className="bg-resolve-warning-light border border-resolve-warning/30 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-resolve-warning shrink-0 mt-0.5" />
                    <div>
                        <div className="font-semibold text-resolve-warning text-sm">Analysis Unavailable</div>
                        <p className="text-sm text-resolve-text-secondary mt-0.5">{analysisError}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* ── Main Investigation Area ── */}
                <div className="xl:col-span-2 space-y-6">

                    {/* Tab Nav */}
                    <div className="flex border-b border-resolve-border">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab
                                    ? 'border-resolve-text-primary text-resolve-text-primary'
                                    : 'border-transparent text-resolve-text-secondary hover:text-resolve-text-primary hover:border-resolve-border'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Symptoms + Metrics */}
                    <Card>
                        <h2 className="text-sm font-bold text-resolve-text-primary uppercase tracking-wider mb-4 flex items-center">
                            <Activity className="w-4 h-4 mr-2 text-resolve-text-muted" /> Live Metrics
                        </h2>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {[
                                { label: 'Error Rate', value: '42.4%', color: 'text-resolve-critical', sub: '↑ from 0.8% at 14:00' },
                                { label: 'P99 Latency', value: '4.2s', color: 'text-resolve-warning', sub: 'SLO breach > 1s' },
                                { label: 'DB Pool', value: '100%', color: 'text-resolve-critical', sub: 'Fully exhausted' },
                            ].map(m => (
                                <div key={m.label} className="bg-resolve-surface-secondary rounded border border-resolve-border p-3">
                                    <div className="text-[10px] uppercase font-bold text-resolve-text-muted tracking-wider mb-1">{m.label}</div>
                                    <div className={`text-2xl font-bold ${m.color} tabular-nums`}>{m.value}</div>
                                    <div className="text-[11px] text-resolve-text-secondary mt-1">{m.sub}</div>
                                </div>
                            ))}
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-resolve-text-muted uppercase tracking-wider mb-2">
                                Error Rate (%) — Today
                            </div>
                            <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={errorRateData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#DC2626" stopOpacity={0.18} />
                                                <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="t" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} unit="%" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            formatter={(value: any) => [`${value ?? 0}%`, 'Error Rate']}
                                            labelStyle={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}
                                        />
                                        <ReferenceLine x="14:32" stroke="#D97706" strokeDasharray="4 4" label={{ value: 'INC-482 Start', position: 'top', fontSize: 10, fill: '#D97706' }} />
                                        <Area type="monotone" dataKey="rate" stroke="#DC2626" strokeWidth={2} fill="url(#errGrad)" dot={false} activeDot={{ r: 4 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Card>

                    {/* Root Cause Hypothesis — from LLM or static fallback */}
                    <Card className="border-l-4 border-l-resolve-hindsight">
                        <h2 className="text-sm font-bold text-resolve-text-primary uppercase tracking-wider mb-3 flex items-center">
                            <BrainCircuit className="w-4 h-4 mr-2 text-resolve-hindsight" /> Root-Cause Hypothesis
                            {analysis && (
                                <Badge variant="hindsight" className="ml-2 text-xs">
                                    {analysis.memory_status === 'available' ? 'Memory Active' : analysis.memory_status}
                                </Badge>
                            )}
                        </h2>

                        {analysis ? (
                            <div className="space-y-3">
                                {analysis.root_cause_hypotheses.map((h, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <span className="text-resolve-hindsight font-bold text-xs mt-0.5">{i + 1}.</span>
                                        <p className="text-sm text-resolve-text-secondary">{h}</p>
                                    </div>
                                ))}
                                {analysis.analysis_reasoning && (
                                    <div className="flex items-start bg-resolve-hindsight/5 border border-resolve-hindsight/20 rounded p-3 mt-2">
                                        <BrainCircuit className="w-4 h-4 text-resolve-hindsight mt-0.5 mr-2.5 flex-shrink-0" />
                                        <p className="text-sm text-resolve-text-secondary">{analysis.analysis_reasoning}</p>
                                    </div>
                                )}
                                {analysis.recurrence_status !== 'no_history' && (
                                    <div className="flex items-start bg-resolve-warning-light/40 border border-resolve-warning/30 rounded p-3">
                                        <AlertTriangle className="w-4 h-4 text-resolve-warning mt-0.5 mr-2.5 flex-shrink-0" />
                                        <div className="text-sm">
                                            <span className="font-bold text-resolve-warning">POSSIBLE RECURRENCE · </span>
                                            <span className="text-resolve-text-primary">
                                                {analysis.recurrence_status === 'confirmed_recurrence'
                                                    ? 'Confirmed recurrence of a previously resolved pattern.'
                                                    : 'This failure pattern was observed before. Historical evidence retrieved.'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-resolve-text-secondary">
                                    Based on live metrics and{' '}
                                    <strong className="text-resolve-hindsight">Hindsight historical evidence</strong>, the primary hypothesis is{' '}
                                    <strong className="text-resolve-text-primary">Database connection pool exhaustion</strong> caused by
                                    unclosed connections in the payment state machine.
                                </p>
                                <div className="flex items-start bg-resolve-warning-light/40 border border-resolve-warning/30 rounded p-3">
                                    <AlertTriangle className="w-4 h-4 text-resolve-warning mt-0.5 mr-2.5 flex-shrink-0" />
                                    <div className="text-sm">
                                        <span className="font-bold text-resolve-warning">POSSIBLE RECURRENCE · </span>
                                        <span className="text-resolve-text-primary">Click "Analyze with Hindsight" to run real-time investigation.</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Recommended Action */}
                    <Card>
                        <h2 className="text-sm font-bold text-resolve-text-primary uppercase tracking-wider mb-4 flex items-center">
                            <Play className="w-4 h-4 mr-2 text-resolve-info" /> Recommended Action
                        </h2>
                        <div className="flex justify-between items-center bg-resolve-surface-secondary border border-resolve-border rounded p-4">
                            <div>
                                <h4 className="font-semibold text-resolve-text-primary mb-1">
                                    {analysis?.recommended_next_action ?? 'Scale DB Pods & Restart Services'}
                                </h4>
                                <p className="text-sm text-resolve-text-secondary">
                                    Temporarily restores service while connection leaks are patched. Confirmed successful in{' '}
                                    <span className="font-mono font-bold text-resolve-text-primary">INC-421</span>.
                                </p>
                            </div>
                            <button className="bg-white border border-resolve-border text-resolve-text-primary text-sm font-semibold px-4 py-2 rounded shadow-sm hover:bg-resolve-surface-secondary transition-colors whitespace-nowrap ml-4">
                                Run Runbook
                            </button>
                        </div>
                    </Card>
                </div>

                {/* ── Memory Intelligence Panel ── */}
                <div className="space-y-6">

                    {/* Memory Stats */}
                    <Card className="bg-gradient-to-br from-[#ECFEFF] to-white border border-resolve-hindsight/25 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-bold text-resolve-hindsight uppercase tracking-wider flex items-center">
                                <BrainCircuit className="w-4 h-4 mr-1.5" /> Memory Used
                            </h2>
                            {analysis && (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${analysis.memory_status === 'available'
                                        ? 'bg-resolve-success/10 text-resolve-success'
                                        : 'bg-resolve-warning/10 text-resolve-warning'
                                    }`}>
                                    {analysis.memory_status}
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { n: analysis ? String(analysis.raw_memory_count) : '—', label: 'Memories recalled' },
                                { n: analysis ? String(analysis.historical_matches.length) : '—', label: 'Incidents matched' },
                                { n: analysis ? String(analysis.root_cause_hypotheses.length) : '—', label: 'Hypotheses' },
                            ].map(s => (
                                <div key={s.label} className="text-center">
                                    <div className="text-2xl font-bold text-resolve-text-primary">{s.n}</div>
                                    <div className="text-[10px] text-resolve-text-secondary leading-tight mt-0.5">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Historical Evidence */}
                    <div className="bg-white border border-resolve-border rounded-lg shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-resolve-border bg-white flex justify-between items-center">
                            <h3 className="font-bold text-resolve-text-primary text-sm">Historical Evidence</h3>
                            {analysis && analysis.historical_matches.length > 0 ? (
                                <Badge variant="hindsight" className="!bg-resolve-hindsight !text-white shadow-sm">
                                    {analysis.historical_matches.length} Match{analysis.historical_matches.length > 1 ? 'es' : ''}
                                </Badge>
                            ) : (
                                <Badge variant="neutral" className="shadow-sm">
                                    {analysis ? 'No Prior Matches' : 'Run Analysis'}
                                </Badge>
                            )}
                        </div>

                        <div className="p-5 space-y-5 overflow-y-auto">
                            {/* Visual similarity link — always for INC-482 */}
                            <div className="flex items-stretch gap-3">
                                <div className="flex flex-col items-center gap-1 py-1">
                                    <div className="w-2 h-2 rounded-full bg-resolve-critical" />
                                    <div className="flex-1 w-px bg-resolve-hindsight/30 border-dashed border-l-2 border-resolve-hindsight/30" />
                                    <div className="w-2 h-2 rounded-full bg-resolve-hindsight" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="bg-resolve-critical/5 border border-resolve-critical/20 rounded p-2.5">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-resolve-critical mb-0.5">Current</div>
                                        <div className="font-mono font-bold text-sm text-resolve-text-primary">{id}</div>
                                        <div className="text-xs text-resolve-text-secondary">503 errors ↑42% · Today</div>
                                    </div>
                                    {analysis && analysis.historical_matches.length > 0 && (
                                        <div className="flex items-center justify-center">
                                            <div className="text-xs font-bold text-resolve-hindsight bg-resolve-hindsight/10 border border-resolve-hindsight/20 rounded-full px-3 py-1">
                                                Historical match found
                                            </div>
                                        </div>
                                    )}
                                    {analysis && analysis.historical_matches.slice(0, 1).map(m => (
                                        <div key={m.incident_number} className="bg-resolve-hindsight/5 border border-resolve-hindsight/20 rounded p-2.5">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-resolve-hindsight mb-0.5">Historical</div>
                                            <div className="font-mono font-bold text-sm text-resolve-text-primary">{m.incident_number}</div>
                                            <div className="text-xs text-resolve-text-secondary">{m.service}</div>
                                            {m.similarity_evidence && (
                                                <div className="text-xs text-resolve-text-muted mt-1 italic">{m.similarity_evidence.slice(0, 80)}</div>
                                            )}
                                        </div>
                                    ))}
                                    {!analysis && (
                                        <div className="bg-resolve-hindsight/5 border border-resolve-hindsight/20 rounded p-2.5 text-center">
                                            <div className="text-xs text-resolve-text-muted">Run analysis to check historical memory</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Resolution attempt timeline — from DB or static */}
                            <div className="relative pl-5 space-y-3 border-l-2 border-resolve-border ml-1">
                                <div className="text-[10px] uppercase font-bold text-resolve-text-muted tracking-wider -ml-5 pl-5 border-b border-resolve-border pb-2 mb-3">
                                    INC-421 Resolution Journey
                                </div>

                                {[
                                    { label: 'Root Cause Identified', sub: 'DB connection pool exhaustion', dot: 'bg-resolve-text-muted', badge: null },
                                    { label: 'Attempt 1 — Restart Service', sub: 'Connections re-saturated in 2 min', dot: 'bg-resolve-critical', badge: { label: 'FAILED', variant: 'critical' as const } },
                                    { label: 'Attempt 2 — Increase Timeout', sub: 'Latency worsened, not viable', dot: 'bg-resolve-warning', badge: { label: 'PARTIAL', variant: 'warning' as const } },
                                    { label: 'Attempt 3 — Rollback', sub: 'Service restored to healthy state', dot: 'bg-resolve-success', badge: { label: 'SUCCESS', variant: 'success' as const } },
                                ].map((item) => (
                                    <div key={item.label} className="relative">
                                        <div className={`absolute w-2.5 h-2.5 rounded-full -left-[1.4rem] top-1 ${item.dot}`} />
                                        <div className="bg-resolve-surface-secondary border border-resolve-border rounded p-2.5 group hover:border-resolve-text-muted transition-colors">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="text-xs font-semibold text-resolve-text-primary">{item.label}</div>
                                                {item.badge && (
                                                    <Badge variant={item.badge.variant} className="text-[10px] px-1.5 py-0 shrink-0">
                                                        {item.badge.label}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-resolve-text-secondary mt-0.5">{item.sub}</div>
                                        </div>
                                    </div>
                                ))}

                                {/* Permanent Remediation */}
                                <div className="relative mt-4">
                                    <div className="absolute w-2.5 h-2.5 rounded-full bg-resolve-success -left-[1.4rem] top-1" />
                                    <div className="bg-white border border-resolve-success/40 rounded p-2.5 relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-resolve-success rounded-l" />
                                        <div className="pl-2">
                                            <div className="text-[10px] font-bold text-resolve-success uppercase tracking-wider">
                                                Permanent Remediation
                                            </div>
                                            <div className="text-xs font-semibold text-resolve-text-primary mt-0.5">
                                                {remediationData?.remediations[0]?.action ?? 'Connection-pool monitoring + config correction'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Verification Dots — from DB */}
                                <div className="relative mt-4">
                                    <div className="absolute w-2.5 h-2.5 rounded-full bg-resolve-info -left-[1.4rem] top-1" />
                                    <div className="p-2">
                                        <div className="text-[10px] font-bold text-resolve-info uppercase tracking-wider mb-2">
                                            Verification — Production Checks
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {verificationPoints.map((vp) => (
                                                <div key={vp.label} className="flex flex-col items-center">
                                                    <div
                                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${vp.status === 'healthy' ? 'bg-resolve-success' : 'bg-resolve-warning'
                                                            }`}
                                                        title={vp.description ?? vp.label}
                                                    >
                                                        {vp.status === 'healthy' ? '✓' : '?'}
                                                    </div>
                                                    <div className="text-[8px] text-resolve-text-muted mt-0.5 text-center leading-tight whitespace-nowrap">
                                                        {vp.label.replace('Day ', 'D')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recurrence alert */}
                            <div className="bg-resolve-warning-light border border-resolve-warning/40 rounded p-3">
                                <div className="font-bold text-resolve-warning text-xs uppercase tracking-wider mb-1 flex items-center">
                                    <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                                    {analysis
                                        ? 'Hindsight-confirmed: Similar Failure Detected'
                                        : 'Similar Failure Pattern Detected Today'}
                                </div>
                                <p className="text-xs text-resolve-text-primary font-medium leading-relaxed">
                                    A previous fix restored the service, but the underlying problem may be returning.
                                </p>
                            </div>
                        </div>

                        <div className="p-3 border-t border-resolve-border bg-resolve-surface-secondary">
                            <Link
                                href="/memory/resolution"
                                className="text-xs font-semibold text-resolve-hindsight hover:underline flex justify-center items-center"
                            >
                                Explore Full Resolution Memory <ArrowRight className="w-3 h-3 ml-1" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Incident Copilot Dock ── */}
            <div className="fixed bottom-6 right-6 w-96 bg-white border border-resolve-border rounded-xl shadow-2xl flex flex-col overflow-hidden z-50"
                style={{ maxHeight: copilotOpen ? 520 : 52 }}>

                <button
                    onClick={() => setCopilotOpen(o => !o)}
                    className="bg-[#0F172A] text-white px-4 py-3 flex justify-between items-center shrink-0 hover:bg-[#1e293b] transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-[#67E8F9]" />
                        <span className="font-bold text-sm">Incident Copilot</span>
                        {analysis?.memory_status === 'available' && (
                            <span className="text-[10px] bg-[#67E8F9]/20 text-[#67E8F9] px-1.5 py-0.5 rounded font-semibold">LIVE</span>
                        )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {copilotOpen ? 'Minimise ↓' : 'Open ↑'}
                    </span>
                </button>

                {copilotOpen && (
                    <>
                        <div className="bg-resolve-surface-secondary border-b border-resolve-border px-4 py-1.5 text-xs text-resolve-text-secondary">
                            Context: <span className="font-semibold text-resolve-text-primary">{id} · Payment Service</span>
                            {analysis && (
                                <span className="ml-2 text-resolve-hindsight font-semibold">
                                    · {analysis.raw_memory_count} memories loaded
                                </span>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 180, maxHeight: 280 }}>
                            {copilotMessages.map((msg, i) => (
                                <div key={i} className={msg.role === 'user' ? 'flex justify-end' : ''}>
                                    {msg.role === 'ai' ? (
                                        <div className="max-w-[90%] bg-white border border-resolve-border rounded-lg p-3 shadow-sm">
                                            <div className="text-[10px] font-bold text-resolve-hindsight uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <BrainCircuit className="w-3 h-3" />
                                                {msg.memory_used ? 'AI Analysis · Memory Used' : 'AI Analysis'}
                                            </div>
                                            <p className="text-sm text-resolve-text-primary leading-relaxed">{msg.text}</p>
                                            {msg.source && (
                                                <div className="mt-2 pt-2 border-t border-resolve-border text-[10px] text-resolve-hindsight font-semibold">
                                                    Source: {msg.source}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="max-w-[90%] bg-[#0F172A] text-white rounded-lg px-3 py-2 text-sm">
                                            {msg.text}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {copilotLoading && (
                                <div className="flex items-center gap-2 text-resolve-hindsight text-xs">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Analyzing with Hindsight memory...
                                </div>
                            )}
                        </div>

                        <div className="px-4 pb-2 grid grid-cols-2 gap-1.5">
                            {["Why is this happening?", "What worked last time?", "Is the remediation still valid?", "Have we seen this before?"].map(q => (
                                <button
                                    key={q}
                                    onClick={() => handleCopilotSend(q)}
                                    disabled={copilotLoading}
                                    className="text-left text-xs bg-white border border-resolve-border rounded px-2 py-1.5 text-resolve-hindsight hover:bg-resolve-hindsight-light/40 transition-colors truncate disabled:opacity-50"
                                    title={q}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>

                        <div className="p-3 border-t border-resolve-border bg-white">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={copilotInput}
                                    onChange={e => setCopilotInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !copilotLoading && handleCopilotSend()}
                                    placeholder="Ask Copilot..."
                                    disabled={copilotLoading}
                                    className="flex-1 text-sm bg-resolve-surface-secondary border border-resolve-border rounded-md px-3 py-2 focus:ring-1 focus:ring-resolve-hindsight outline-none disabled:opacity-50"
                                />
                                <button
                                    onClick={() => handleCopilotSend()}
                                    disabled={copilotLoading || !copilotInput.trim()}
                                    className="bg-resolve-hindsight text-white rounded-md px-3 py-2 text-sm font-semibold hover:bg-resolve-hindsight/90 transition-colors disabled:opacity-50"
                                >
                                    {copilotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ask'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
