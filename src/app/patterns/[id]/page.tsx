'use client';
import { LayoutGrid, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

export default function PatternDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return (
        <div className="space-y-6 animate-fade-in text-resolve-text-primary">
            <Link href="/patterns" className="inline-flex items-center text-sm text-resolve-text-secondary hover:text-resolve-info">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Recurrence Patterns
            </Link>
            <div className="p-8 bg-white border border-resolve-border rounded-lg shadow-sm">
                <h1 className="text-2xl font-bold flex items-center mb-4"><LayoutGrid className="w-6 h-6 mr-3 text-resolve-text-primary" /> Pattern Intelligence: {id}</h1>
                <p className="text-resolve-text-secondary">AI-generated diagnostic cluster and organizational exposure for this pattern.</p>
            </div>
        </div>
    );
}
