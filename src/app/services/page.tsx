'use client';

import { Activity, Database, Server, Component, AlertTriangle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const SERVICES = [
    {
        name: 'Payment Service',
        type: 'database',
        status: 'critical',
        activeIncidents: 1,
        historicalIncidents: 3,
        pastSimilarity: 87,
        recurrenceRisk: 'HIGH'
    },
    {
        name: 'Checkout API',
        type: 'api',
        status: 'warning',
        activeIncidents: 1,
        historicalIncidents: 12,
        pastSimilarity: null,
        recurrenceRisk: 'MEDIUM'
    },
    {
        name: 'Auth Service',
        type: 'service',
        status: 'healthy',
        activeIncidents: 0,
        historicalIncidents: 2,
        pastSimilarity: null,
        recurrenceRisk: 'LOW'
    },
    {
        name: 'User Profile DB',
        type: 'database',
        status: 'healthy',
        activeIncidents: 0,
        historicalIncidents: 0,
        pastSimilarity: null,
        recurrenceRisk: 'LOW'
    }
];

export default function Services() {
    return (
        <div className="space-y-6 animate-fade-in fade-in-0 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-resolve-text-primary tracking-tight">Services Overview</h1>
                    <p className="text-sm text-resolve-text-secondary mt-1">System health mapped against historical memory.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {SERVICES.map((svc) => (
                    <Card key={svc.name} className="flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-resolve-surface-secondary rounded border border-resolve-border">
                                {svc.type === 'database' ? <Database className="w-5 h-5 text-resolve-text-primary" /> : svc.type === 'api' ? <Server className="w-5 h-5 text-resolve-text-primary" /> : <Component className="w-5 h-5 text-resolve-text-primary" />}
                            </div>
                            <Badge variant={svc.status === 'critical' ? 'critical' : svc.status === 'warning' ? 'warning' : 'success'}>
                                {svc.status.toUpperCase()}
                            </Badge>
                        </div>

                        <h3 className="text-lg font-bold text-resolve-text-primary mb-2 truncate" title={svc.name}>{svc.name}</h3>

                        <div className="space-y-3 mt-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-resolve-text-secondary">Active Incidents</span>
                                <span className={svc.activeIncidents > 0 ? 'font-bold text-resolve-critical' : 'font-medium text-resolve-text-primary'}>{svc.activeIncidents}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-resolve-text-secondary">Historical Incidents</span>
                                <span className="font-medium text-resolve-text-primary">{svc.historicalIncidents}</span>
                            </div>

                            {svc.pastSimilarity && (
                                <div className="flex justify-between items-center text-sm bg-resolve-hindsight-light/30 border border-resolve-hindsight/20 rounded px-2 py-1 mt-2">
                                    <span className="text-resolve-hindsight font-semibold text-xs uppercase tracking-wider">Hindsight Match</span>
                                    <span className="font-bold text-resolve-hindsight">{svc.pastSimilarity}%</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-sm pt-2 border-t border-resolve-border">
                                <span className="text-resolve-text-secondary">Recurrence Risk</span>
                                {svc.recurrenceRisk === 'HIGH' ? (
                                    <span className="font-bold text-resolve-critical flex items-center text-xs"><AlertTriangle className="w-3 h-3 mr-1" /> HIGH</span>
                                ) : svc.recurrenceRisk === 'MEDIUM' ? (
                                    <span className="font-bold text-resolve-warning text-xs">MEDIUM</span>
                                ) : (
                                    <span className="font-bold text-resolve-success flex items-center text-xs"><ShieldCheck className="w-3 h-3 mr-1" /> LOW</span>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
