'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity, AlertTriangle, BrainCircuit, CheckCircle2, ChevronRight,
  Database, Search, ShieldAlert, TrendingUp, BarChart3, History,
  RefreshCw, WifiOff, ShieldCheck, Repeat, Clock, XCircle
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { IncidentTrendChart, ResolutionOutcomeChart, SeverityDistributionChart } from '@/components/ui/charts';
import { incidentsApi } from '@/lib/api/incidents';
import { patternsApi, Pattern } from '@/lib/api/patterns';
import { servicesApi } from '@/lib/api/services';
import type { IncidentListItem } from '@/types/incidents';

/* ─── Helpers ─────────────────────────────────────────────────────── */
function duration(openedAt: string): string {
  try {
    const ms = Date.now() - new Date(openedAt).getTime();
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  } catch {
    return '—';
  }
}

function severityVariant(s: string): 'critical' | 'warning' | 'info' | 'success' | 'neutral' | 'hindsight' {
  const map: Record<string, 'critical' | 'warning' | 'info' | 'success' | 'neutral'> = {
    critical: 'critical', high: 'critical', medium: 'warning', warning: 'warning', low: 'info',
  };
  return map[s] ?? 'neutral';
}

/* ─── Loading skeletons ───────────────────────────────────────────── */
function KpiSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-resolve-border shadow-sm p-6 animate-pulse space-y-3">
      <div className="h-3 w-24 bg-slate-200 rounded" />
      <div className="h-8 w-16 bg-slate-200 rounded" />
      <div className="h-3 w-32 bg-slate-200 rounded" />
    </div>
  );
}

function IncidentSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-resolve-border shadow-sm p-6 animate-pulse space-y-3">
      <div className="flex gap-3">
        <div className="h-5 w-20 bg-slate-200 rounded" />
        <div className="h-5 w-16 bg-red-100 rounded-full" />
      </div>
      <div className="h-6 w-3/4 bg-slate-200 rounded" />
      <div className="h-4 w-1/2 bg-slate-100 rounded" />
    </div>
  );
}

/* ─── Error / empty states ────────────────────────────────────────── */
function ApiError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm">
      <WifiOff className="w-4 h-4 text-red-400 shrink-0" />
      <span className="text-red-700 font-medium">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="ml-auto flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700">
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <Icon className="w-10 h-10 text-slate-200 mb-3" />
      <div className="text-sm font-semibold text-slate-400">{title}</div>
      <div className="text-xs text-slate-300 mt-1 max-w-xs">{body}</div>
    </div>
  );
}

/* ─── KPI Card ────────────────────────────────────────────────────── */
function KpiCard({
  title, value, subtext, icon: Icon, accent,
}: {
  title: string; value: string | number; subtext: string; icon: React.ElementType; accent?: string;
}) {
  return (
    <Card className={`flex flex-col border-l-4 ${accent ?? 'border-l-resolve-text-muted'}`}>
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-xs font-bold text-resolve-text-muted uppercase tracking-wider">{title}</h3>
        <Icon className="h-4 w-4 text-resolve-text-muted opacity-70" />
      </div>
      <div className="text-3xl font-bold text-resolve-text-primary mb-1">{value}</div>
      <p className="text-xs font-medium text-resolve-text-secondary">{subtext}</p>
    </Card>
  );
}

/* ─── Main component ──────────────────────────────────────────────── */
export default function Dashboard() {
  const [incidents, setIncidents] = useState<IncidentListItem[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [serviceCount, setServiceCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [incidentError, setIncidentError] = useState<string | null>(null);
  const [patternError, setPatternError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setIncidentError(null);
    setPatternError(null);

    // Fetch all in parallel — independent, don't block each other
    const [incRes, patRes, svcRes] = await Promise.allSettled([
      incidentsApi.list(),
      patternsApi.list(),
      servicesApi.list(),
    ]);

    if (incRes.status === 'fulfilled') {
      setIncidents(incRes.value);
    } else {
      setIncidentError('Incident data unavailable. Unable to retrieve the current incident state.');
      setIncidents([]);
    }

    if (patRes.status === 'fulfilled') {
      setPatterns(patRes.value);
    } else {
      setPatternError('Recurrence pattern data unavailable.');
      setPatterns([]);
    }

    if (svcRes.status === 'fulfilled') {
      setServiceCount(svcRes.value.length);
    } else {
      setServiceCount(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Derived KPIs — deterministic, from real data
  const active = incidents.filter(i => ['open', 'investigating'].includes(i.status));
  const resolved = incidents.filter(i => ['resolved', 'closed'].includes(i.status));
  const critical = active.filter(i => i.severity === 'critical' || i.severity === 'high');
  const affectedServices = new Set(active.map(i => i.service?.name).filter(Boolean)).size;
  const inc482 = incidents.find(i => i.incident_number === 'INC-482');

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-resolve-text-primary tracking-tight">Operations Dashboard</h1>
          <p className="text-sm text-resolve-text-secondary mt-1">Platform intelligence and real-time incident state.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-xs font-semibold text-resolve-text-muted hover:text-resolve-text-primary px-3 py-1.5 rounded-md border border-resolve-border hover:bg-resolve-surface-secondary transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          [1, 2, 3, 4].map(i => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              title="Active Incidents"
              value={incidentError ? '—' : active.length}
              subtext={incidentError ? 'Data unavailable' : critical.length > 0 ? `${critical.length} critical requiring attention` : 'No critical incidents'}
              icon={AlertTriangle}
              accent={critical.length > 0 ? 'border-l-resolve-critical' : 'border-l-resolve-text-muted'}
            />
            <KpiCard
              title="Resolved"
              value={incidentError ? '—' : resolved.length}
              subtext={incidentError ? 'Data unavailable' : `${incidents.length} total incidents on record`}
              icon={CheckCircle2}
              accent="border-l-resolve-success"
            />
            <KpiCard
              title="Recurrence Patterns"
              value={patternError ? '—' : patterns.length}
              subtext={patternError ? 'Pattern data unavailable' : patterns.length > 0 ? 'Organizational patterns detected' : 'No patterns detected'}
              icon={ShieldAlert}
              accent={patterns.length > 0 ? 'border-l-resolve-warning' : 'border-l-resolve-text-muted'}
            />
            <KpiCard
              title="Services"
              value={serviceCount ?? '—'}
              subtext={serviceCount !== null ? `${affectedServices} currently affected` : 'Data unavailable'}
              icon={Activity}
              accent={affectedServices > 0 ? 'border-l-resolve-warning' : 'border-l-resolve-success'}
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-resolve-text-primary">Incident Trend</h3>
            <TrendingUp className="w-4 h-4 text-resolve-text-muted" />
          </div>
          <p className="text-xs text-resolve-text-secondary mb-0">Incident volume over time.</p>
          <IncidentTrendChart incidents={incidents} loading={loading} />
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-resolve-text-primary">Resolution Outcomes</h3>
            <BarChart3 className="w-4 h-4 text-resolve-text-muted" />
          </div>
          <p className="text-xs text-resolve-text-secondary mb-0">Historical effectiveness across incidents.</p>
          <ResolutionOutcomeChart incidents={incidents} loading={loading} />
        </Card>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Active incidents — 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-resolve-text-primary">Action Required</h2>

          {incidentError && <ApiError message={incidentError} onRetry={load} />}

          {loading && <IncidentSkeleton />}

          {!loading && !incidentError && active.length === 0 && (
            <Card>
              <EmptyState
                icon={CheckCircle2}
                title="No active incidents"
                body="All monitored services are currently without active incidents."
              />
            </Card>
          )}

          {!loading && !incidentError && active.map(inc => (
            <Card
              key={inc.id}
              noPadding
              className={`overflow-hidden relative ${inc.severity === 'critical' || inc.severity === 'high'
                ? 'border-resolve-critical/30 ring-1 ring-resolve-critical/10'
                : 'border-resolve-warning/30'
                }`}
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${inc.severity === 'critical' || inc.severity === 'high' ? 'bg-resolve-critical' : 'bg-resolve-warning'}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold bg-resolve-surface-secondary px-2 py-0.5 rounded">
                      {inc.incident_number}
                    </span>
                    <Badge variant={severityVariant(inc.severity)}>{inc.severity.toUpperCase()}</Badge>
                    {inc.service && (
                      <span className="text-sm text-resolve-text-secondary flex items-center gap-1">
                        <Database className="w-3.5 h-3.5" /> {inc.service.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-resolve-text-muted">
                    <Clock className="w-3 h-3" /> {duration(inc.opened_at)}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-resolve-text-primary mb-3">{inc.title}</h3>

                {/* INC-482 Hindsight callout */}
                {inc.incident_number === 'INC-482' && (
                  <div className="bg-resolve-warning-light/30 border border-resolve-warning/20 rounded-md p-4">
                    <div className="flex items-start gap-3">
                      <Search className="w-5 h-5 text-resolve-warning mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-resolve-warning mb-1">Historical Match Detected</h4>
                        <p className="text-sm text-resolve-text-secondary mb-3">
                          High confidence similarity to a previous database connection exhaustion incident.
                        </p>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1.5 text-sm">
                            <span className="text-xs text-resolve-text-muted uppercase tracking-wider">Previous:</span>
                            <span className="font-mono font-medium">INC-421</span>
                          </div>
                          <Badge variant="hindsight" className="!bg-resolve-hindsight !text-white text-xs">87% Similarity</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-resolve-surface-secondary border-t border-resolve-border px-5 py-3 flex justify-between items-center">
                <span className="text-xs text-resolve-text-muted capitalize flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-blue-500 animate-pulse" /> {inc.status}
                </span>
                <Link
                  href={`/incidents/${inc.incident_number}`}
                  className="inline-flex items-center gap-1.5 bg-resolve-text-primary text-white text-sm font-semibold px-4 py-1.5 rounded-md hover:bg-resolve-text-primary/90 transition-all"
                >
                  Investigate <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </Card>
          ))}

          {/* Recurrence patterns */}
          <h2 className="text-lg font-semibold text-resolve-text-primary pt-2">Recurrence Intelligence</h2>
          {patternError && <ApiError message={patternError} onRetry={load} />}
          {!loading && !patternError && patterns.length === 0 && (
            <Card><EmptyState icon={Repeat} title="No recurring failure patterns detected" body="No recurring patterns have been identified yet." /></Card>
          )}
          {!loading && !patternError && patterns.map((p, i) => {
            const latest = p.occurrences.slice(-1)[0];
            return (
              <Card key={i} noPadding className="overflow-hidden hover:border-resolve-text-muted transition-colors">
                <div className="absolute top-0 left-0 w-1 h-full bg-resolve-warning" />
                <div className="p-5 relative">
                  <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Repeat className="w-4 h-4 text-resolve-warning" />
                      <span className="text-xs font-bold text-resolve-warning uppercase tracking-wider">Recurrence Pattern</span>
                    </div>
                    <Badge variant="warning">{p.count} incident{p.count !== 1 ? 's' : ''}</Badge>
                  </div>
                  <h3 className="text-base font-bold text-resolve-text-primary mb-1">{p.root_cause}</h3>
                  <p className="text-sm text-resolve-text-secondary mb-3">{p.service}</p>
                  {latest && (
                    <div className="flex items-center gap-2 text-xs text-resolve-text-muted">
                      <span>Latest:</span>
                      <span className="font-mono font-bold text-resolve-text-primary">{latest.incident_number}</span>
                      <Badge variant={severityVariant(latest.severity)} className="text-[10px]">{latest.severity}</Badge>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Right column: Memory + Severity */}
        <div className="col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-resolve-text-primary flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-resolve-hindsight" /> Hindsight Memory
          </h2>

          <Card className="bg-gradient-to-br from-resolve-hindsight-light/50 to-resolve-surface border border-resolve-hindsight/20 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 text-resolve-hindsight/5 rotate-12 pointer-events-none">
              <History strokeWidth={1} size={150} />
            </div>
            <div className="space-y-5 relative z-10">
              <p className="text-sm font-bold text-resolve-hindsight uppercase tracking-wider">Organizational Learning Context</p>
              <div className="space-y-3">
                {[
                  { n: incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length, label: 'Historical incidents in memory' },
                  { n: patterns.length, label: 'Recurrence patterns identified' },
                  { n: 1, label: 'Verified remediations tracked' },
                ].map(({ n, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-resolve-hindsight/10 text-resolve-hindsight font-bold border border-resolve-hindsight/20 text-sm">
                      {loading ? '·' : n}
                    </div>
                    <span className="text-sm font-medium text-resolve-text-primary">{label}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-resolve-hindsight/10">
                <Link
                  href="/memory/resolution"
                  className="inline-flex items-center w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-resolve-hindsight border border-resolve-hindsight/30 hover:bg-resolve-hindsight-light/50 transition-all shadow-sm"
                >
                  View Memory Sources
                </Link>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-resolve-text-primary mb-1 uppercase tracking-wider">Severity Distribution</h3>
            <p className="text-xs text-resolve-text-secondary mb-3">Incident load across severity levels.</p>
            {loading
              ? <div className="h-12 bg-slate-100 rounded animate-pulse" />
              : <SeverityDistributionChart incidents={incidents} loading={loading} />
            }
          </Card>

          {/* Remediation effectiveness */}
          <h2 className="text-lg font-semibold text-resolve-text-primary flex items-center gap-2 pt-2">
            <ShieldCheck className="w-5 h-5 text-resolve-success" /> Remediation
          </h2>
          <Card>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-resolve-text-primary">Connection Pool Configuration</div>
                  <div className="text-xs text-resolve-text-muted mt-0.5">INC-421 — Payment Service</div>
                </div>
                <Badge variant="success">Verified Effective</Badge>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Day 1', status: 'healthy' },
                  { label: 'Day 30', status: 'healthy' },
                  { label: 'Day 90', status: 'healthy' },
                  { label: 'Day 147', status: 'healthy' },
                ].map(v => (
                  <div key={v.label} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-resolve-success shrink-0" />
                    <span className="text-resolve-text-secondary font-medium">{v.label}</span>
                    <span className="text-resolve-success">Healthy</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-resolve-border">
                <Link href="/memory/remediation" className="text-xs font-semibold text-resolve-hindsight hover:underline flex items-center gap-1">
                  View remediation details <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
