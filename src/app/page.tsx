'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    Activity, ArrowRight, BrainCircuit, ShieldCheck, AlertTriangle,
    History, CheckCircle2, Database, Repeat, Target, StopCircle, Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

/* ─── Scroll reveal hook ─────────────────────────────────────────── */
function useScrollReveal(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setVisible(true);
            return;
        }
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return { ref, visible };
}

/* ─── Parallax scroll value hook ────────────────────────────────── */
function useParallax() {
    const [scrollY, setScrollY] = useState(0);
    useEffect(() => {
        const handler = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    }, []);
    return scrollY;
}

/* ─── Reveal wrapper ────────────────────────────────────────────── */
function Reveal({
    children, delay = 0, className = '', direction = 'up',
}: {
    children: React.ReactNode; delay?: number; className?: string; direction?: 'up' | 'left' | 'right' | 'none';
}) {
    const { ref, visible } = useScrollReveal();
    const transforms: Record<string, string> = {
        up: 'translateY(36px)', left: 'translateX(-36px)', right: 'translateX(36px)', none: 'none',
    };
    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'none' : transforms[direction],
                transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}

/* ─── 3D Tilt card ──────────────────────────────────────────────── */
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [hovered, setHovered] = useState(false);
    const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function onMove(e: React.MouseEvent<HTMLDivElement>) {
        if (reducedMotion) return;
        const el = cardRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        setTilt({ x: (e.clientY - cy) / (rect.height / 2) * -6, y: (e.clientX - cx) / (rect.width / 2) * 6 });
    }

    return (
        <div
            ref={cardRef}
            className={`transition-shadow duration-300 ${hovered ? 'shadow-2xl' : 'shadow-sm'} ${className}`}
            style={{
                transform: hovered && !reducedMotion
                    ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)`
                    : 'perspective(900px) rotateX(0) rotateY(0) scale(1)',
                transition: 'transform 0.25s ease, shadow 0.3s ease',
                willChange: 'transform',
            }}
            onMouseMove={onMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
        >
            {children}
        </div>
    );
}

/* ─── Floating orb ──────────────────────────────────────────────── */
function FloatingOrb({ style }: { style: React.CSSProperties }) {
    return (
        <div
            className="absolute rounded-full pointer-events-none"
            style={{
                background: 'radial-gradient(circle at 40% 40%, rgba(8,145,178,0.18), rgba(8,145,178,0.02))',
                filter: 'blur(60px)',
                animation: 'float 8s ease-in-out infinite',
                ...style,
            }}
        />
    );
}

/* ─── Main page ─────────────────────────────────────────────────── */
export default function LandingPage() {
    const scrollY = useParallax();
    const [navScrolled, setNavScrolled] = useState(false);
    useEffect(() => {
        const h = () => setNavScrolled(window.scrollY > 20);
        window.addEventListener('scroll', h, { passive: true });
        return () => window.removeEventListener('scroll', h);
    }, []);

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] overflow-x-hidden selection:bg-cyan-100">
            <style>{`
        @keyframes float { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-24px)} }
        @keyframes pulseRing { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.2);opacity:0} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .animate-marquee { animation: marquee 22s linear infinite; }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:0.01ms!important; transition-duration:0.01ms!important; } }
      `}</style>

            {/* ── NAVBAR ── */}
            <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${navScrolled ? 'bg-white/90 backdrop-blur-lg border-b border-slate-200/80 py-3 shadow-sm' : 'bg-transparent py-5'}`}>
                <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="bg-[#0F172A] p-1.5 rounded-lg shadow-md group-hover:bg-[#0891B2] transition-colors duration-300">
                            <Activity className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-extrabold text-lg tracking-wide">RESOLVE</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        {['Product', 'How It Works', 'Memory', 'Intelligence'].map(s => (
                            <a key={s} href={`#${s.toLowerCase().replace(' ', '-')}`} className="hover:text-[#0891B2] transition-colors">{s}</a>
                        ))}
                    </div>
                    <Link href="/dashboard" className="flex items-center gap-1.5 bg-[#0F172A] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#0891B2] transition-colors shadow-md group">
                        Open Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </nav>
            </header>

            {/* ── HERO ── */}
            <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
                <FloatingOrb style={{ width: 600, height: 600, top: -100, right: -100 }} />
                <FloatingOrb style={{ width: 400, height: 400, bottom: -50, left: '10%', animationDelay: '-4s' }} />

                {/* 3D Grid background */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(226,232,240,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(226,232,240,0.5) 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                        transform: `perspective(800px) rotateX(${Math.min(scrollY * 0.03, 12)}deg)`,
                        transformOrigin: 'top center',
                        opacity: Math.max(0, 1 - scrollY / 400),
                    }}
                />

                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10 w-full py-20">
                    <div>
                        <Reveal>
                            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1 mb-6 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-[#0891B2] animate-pulse" />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Incident Intelligence Platform</span>
                            </div>
                        </Reveal>
                        <Reveal delay={100}>
                            <h1 className="text-5xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
                                Incident response<br />
                                <span className="text-[#0891B2]">that remembers.</span>
                            </h1>
                        </Reveal>
                        <Reveal delay={200}>
                            <p className="text-xl text-slate-500 mb-8 max-w-lg leading-relaxed">
                                RESOLVE connects incidents, root causes, attempted fixes, permanent remediation, and verification into persistent organizational memory.
                            </p>
                        </Reveal>
                        <Reveal delay={300}>
                            <div className="flex flex-wrap gap-4">
                                <Link href="/dashboard" className="inline-flex items-center gap-2 bg-[#0891B2] text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-[0_8px_30px_rgba(8,145,178,0.35)] hover:-translate-y-0.5 transition-all">
                                    Explore RESOLVE <ArrowRight className="w-4 h-4" />
                                </Link>
                                <a href="#how-it-works" className="inline-flex items-center gap-2 bg-white text-slate-800 font-semibold px-6 py-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:-translate-y-0.5 transition-all shadow-sm">
                                    How it works
                                </a>
                            </div>
                        </Reveal>
                    </div>

                    {/* Hero 3D card stack */}
                    <Reveal delay={200} direction="right">
                        <div className="relative h-[460px]">
                            {/* Card stack: back */}
                            <div className="absolute top-12 left-8 right-0 bg-white border border-slate-200 rounded-2xl shadow-lg p-5 opacity-40"
                                style={{ transform: 'perspective(600px) rotateY(-8deg) rotateX(4deg)' }} />
                            <div className="absolute top-6 left-4 right-0 bg-white border border-slate-200 rounded-2xl shadow-lg p-5 opacity-60"
                                style={{ transform: 'perspective(600px) rotateY(-5deg) rotateX(2deg)' }} />

                            {/* Main memory network card */}
                            <TiltCard className="absolute inset-0 bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                <HeroCard />
                            </TiltCard>
                        </div>
                    </Reveal>
                </div>

                {/* Social proof marquee */}
                <div className="absolute bottom-8 inset-x-0 overflow-hidden opacity-60">
                    <div className="animate-marquee flex gap-12 whitespace-nowrap text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        {['Organizational Memory', 'Hindsight Intelligence', 'Verified Remediation', '147-Day Verification', 'Root Cause Analysis', 'Recurrence Patterns',
                            'Organizational Memory', 'Hindsight Intelligence', 'Verified Remediation', '147-Day Verification', 'Root Cause Analysis', 'Recurrence Patterns'].map((t, i) => (
                                <span key={i} className="flex items-center gap-4">
                                    {t} <span className="text-[#0891B2]">·</span>
                                </span>
                            ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION: Problem Statement ── */}
            <section id="product" className="py-32 bg-white border-y border-slate-100 relative overflow-hidden">
                <FloatingOrb style={{ width: 500, height: 500, top: -100, left: '50%', transform: 'translateX(-50%)' }} />
                <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
                    <Reveal>
                        <h2 className="text-4xl md:text-5xl xl:text-6xl font-extrabold tracking-tight mb-4">
                            Every incident gets resolved.
                        </h2>
                        <h2 className="text-3xl md:text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-300 mb-10">
                            Not every incident gets learned from.
                        </h2>
                    </Reveal>
                    <Reveal delay={150}>
                        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-16">
                            Traditional tools preserve what happened. RESOLVE connects the investigation, evaluation, remediation, and verification — so future teams inherit the learning.
                        </p>
                    </Reveal>

                    {/* 3-step flow */}
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: AlertTriangle, color: '#DC2626', title: 'Incident Occurs', body: 'Structured symptoms, severity, and service context captured.' },
                            { icon: BrainCircuit, color: '#0891B2', title: 'Memory Recalled', body: "Hindsight surfaces what happened in similar past incidents." },
                            { icon: ShieldCheck, color: '#16A34A', title: 'Outcome Verified', body: 'Permanent remediation tracked and verified over 30, 90, 180 days.' },
                        ].map(({ icon: Icon, color, title, body }, i) => (
                            <Reveal key={title} delay={i * 120} direction="up">
                                <TiltCard className="bg-white border border-slate-100 rounded-2xl p-7 text-left shadow-sm hover:border-slate-200 transition-colors">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 shadow-sm" style={{ background: `${color}18` }}>
                                        <Icon className="w-6 h-6" style={{ color }} />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">{title}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
                                </TiltCard>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION: How It Works ── */}
            <section id="how-it-works" className="py-32 relative overflow-hidden">
                <FloatingOrb style={{ width: 500, height: 500, bottom: 0, right: -100 }} />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <Reveal>
                        <div className="mb-16">
                            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Investigate with context.</h2>
                            <p className="text-xl text-slate-500 max-w-xl">When INC-482 fires, RESOLVE instantly recalls INC-421 — with all its failed attempts, the successful fix, and 147 days of verification evidence.</p>
                        </div>
                    </Reveal>

                    <div className="grid lg:grid-cols-12 gap-6 items-start">
                        {/* Incident card */}
                        <Reveal className="lg:col-span-4" direction="left">
                            <TiltCard className="bg-white border-2 border-red-200 rounded-2xl p-6 shadow-md">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="relative w-3 h-3">
                                        <div className="absolute inset-0 rounded-full bg-red-500" style={{ animation: 'pulseRing 1.5s ease-out infinite' }} />
                                        <div className="w-3 h-3 rounded-full bg-red-500 relative z-10" />
                                    </div>
                                    <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Live Incident</span>
                                </div>
                                <div className="font-mono text-sm font-bold bg-slate-100 px-2 py-1 rounded inline-block mb-3">INC-482</div>
                                <div className="text-xl font-bold mb-2">503 errors ↑42%</div>
                                <div className="text-sm text-slate-500 flex items-center gap-1.5"><Database className="w-4 h-4" /> Payment Service</div>
                            </TiltCard>
                        </Reveal>

                        {/* Arrow */}
                        <div className="lg:col-span-1 hidden lg:flex items-center justify-center pt-16">
                            <div className="flex flex-col items-center gap-2 text-[#0891B2]">
                                <div className="h-12 w-px bg-gradient-to-b from-transparent via-[#0891B2] to-[#0891B2]" />
                                <Zap className="w-5 h-5" />
                                <span className="text-[10px] font-bold uppercase tracking-widest rotate-90 origin-center mt-2">Recall</span>
                            </div>
                        </div>

                        {/* Hindsight card */}
                        <Reveal className="lg:col-span-7" delay={150} direction="right">
                            <TiltCard className="bg-gradient-to-br from-cyan-50 to-white border border-[#0891B2]/20 rounded-2xl p-6 shadow-md">
                                <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#0891B2]/10">
                                    <div className="flex items-center gap-2 text-[#0891B2] font-bold text-sm uppercase tracking-wider">
                                        <BrainCircuit className="w-5 h-5" /> Hindsight Context
                                    </div>
                                    <Badge variant="hindsight" className="!bg-[#0891B2] !text-white">1 Match Found</Badge>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-white rounded-xl border border-slate-100 p-4">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Historical Incident</div>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono font-bold text-slate-700">INC-421</span>
                                            <Badge variant="success">Resolved</Badge>
                                        </div>
                                        <div className="text-sm font-semibold mb-1">DB Connection Pool Saturation</div>
                                        <p className="text-xs text-slate-400 italic">Similar symptom pattern. Payment Service.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white border border-red-100 rounded-xl p-3">
                                            <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Failed</div>
                                            <div className="text-sm font-semibold">Restart Pods</div>
                                        </div>
                                        <div className="bg-white border border-green-100 rounded-xl p-3">
                                            <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Successful</div>
                                            <div className="text-sm font-semibold">Rollback v2.4.0</div>
                                        </div>
                                    </div>
                                </div>
                            </TiltCard>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* ── SECTION: Verification Timeline ── */}
            <section id="memory" className="py-32 bg-[#0F172A] text-white relative overflow-hidden">
                <FloatingOrb style={{ width: 600, height: 600, right: -150, top: -100, background: 'radial-gradient(circle, rgba(8,145,178,0.12), transparent)' }} />
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center relative z-10">
                    <div className="space-y-10">
                        <Reveal>
                            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
                                A workaround is not the same as a fix.
                            </h2>
                            <p className="text-slate-400 mt-4 text-lg">RESOLVE tracks beyond the alert disappearing. Automated verification checkpoints test whether the fix actually held.</p>
                        </Reveal>
                        <Reveal delay={100}>
                            <h3 className="text-2xl font-bold text-[#67E8F9]">Did the fix stay fixed?</h3>
                            <p className="text-slate-400 mt-2">Verification events at Day 1, 30, 90, and 147 confirm system health — with evidence, not assumptions.</p>
                        </Reveal>
                        <Reveal delay={200}>
                            <Link href="/dashboard" className="inline-flex items-center gap-2 bg-[#0891B2] text-white font-semibold px-5 py-3 rounded-xl hover:bg-[#0891B2]/80 transition-colors">
                                See Verification Evidence <ArrowRight className="w-4 h-4" />
                            </Link>
                        </Reveal>
                    </div>

                    {/* Verification timeline */}
                    <Reveal delay={200} direction="right">
                        <TiltCard className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Verification Timeline — INC-421</div>
                            <div className="space-y-6 relative before:absolute before:top-0 before:bottom-0 before:left-[18px] before:w-0.5 before:bg-white/10">
                                {[
                                    { day: 'Day 1', label: 'Post-remediation verified healthy', ok: true },
                                    { day: 'Day 30', label: '30-day stability checkpoint passed', ok: true },
                                    { day: 'Day 90', label: '90-day verification confirmed', ok: true },
                                    { day: 'Day 147', label: 'Sustained — no recurrence detected', ok: true },
                                ].map((item, i) => (
                                    <div key={i} className="relative flex items-center gap-5 group">
                                        <div className={`relative z-10 w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${item.ok ? 'bg-green-500 border-green-400 shadow-[0_0_16px_rgba(34,197,94,0.4)]' : 'bg-slate-700 border-slate-600'}`}>
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex-1 group-hover:bg-white/10 transition-colors">
                                            <div className="text-xs font-bold text-green-400 mb-0.5">{item.day}</div>
                                            <div className="text-sm text-slate-300">{item.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 pt-5 border-t border-white/10 text-center">
                                <span className="text-xs font-bold text-green-400 uppercase tracking-widest">✓ Remediation Verified Effective</span>
                            </div>
                        </TiltCard>
                    </Reveal>
                </div>
            </section>

            {/* ── SECTION: Intelligence ── */}
            <section id="intelligence" className="py-32 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-8">
                    <Reveal direction="left">
                        <TiltCard className="bg-[#F8FAFC] border border-slate-100 rounded-2xl p-8 h-full shadow-sm">
                            <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center shadow-sm mb-6">
                                <Repeat className="w-6 h-6 text-[#0891B2]" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Organizational failure patterns</h3>
                            <p className="text-slate-500 mb-8 leading-relaxed">
                                RESOLVE identifies recurrence across services and teams. See the pattern before it becomes the next major incident.
                            </p>
                            <div className="bg-white border border-slate-100 rounded-xl p-5">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">Pattern: DB Connection Exhaustion</div>
                                <div className="flex items-center gap-2 text-sm font-mono mb-3">
                                    <span className="text-red-500 font-bold">INC-398</span>
                                    <div className="h-px flex-1 bg-slate-200" />
                                    <span className="text-[#0891B2] font-bold">INC-421</span>
                                    <div className="h-px flex-1 bg-slate-200" />
                                    <span className="text-amber-500 font-bold">INC-447</span>
                                </div>
                                <p className="text-xs text-slate-400 font-medium">3 incidents linked by shared root cause · 2 services affected</p>
                            </div>
                        </TiltCard>
                    </Reveal>

                    <Reveal delay={120} direction="right">
                        <TiltCard className="bg-[#0F172A] rounded-2xl p-8 h-full shadow-xl relative overflow-hidden border border-slate-700">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0891B2]/10 blur-3xl rounded-full pointer-events-none" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-slate-800 border border-slate-600 rounded-xl flex items-center justify-center shadow-sm mb-6">
                                    <BrainCircuit className="w-6 h-6 text-[#67E8F9]" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">AI Copilot powered by Memory</h3>
                                <p className="text-slate-400 mb-8 leading-relaxed">
                                    Copilot aggregates what happened, what was tried, and what worked — instantly, across your entire engineering history.
                                </p>
                                <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-4">
                                    <div className="flex justify-end">
                                        <div className="bg-slate-800 text-sm text-slate-200 px-4 py-2.5 rounded-xl border border-slate-700 max-w-[85%]">
                                            Have we seen this before?
                                        </div>
                                    </div>
                                    <div className="flex justify-start">
                                        <div className="bg-[#0891B2]/10 border border-[#0891B2]/30 text-sm text-slate-200 px-4 py-3 rounded-xl max-w-[90%]">
                                            <div className="text-[#67E8F9] font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Historical match found
                                            </div>
                                            Yes — <span className="font-mono text-[#67E8F9] font-bold">INC-421</span>. Restarting pods failed. Rollback to v2.4.0 succeeded and was verified for 147 days.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TiltCard>
                    </Reveal>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-32 relative overflow-hidden bg-white border-t border-slate-100">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#0891B2]/10 rounded-t-full blur-[80px] pointer-events-none" />
                <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
                    <Reveal>
                        <h2 className="text-4xl md:text-5xl xl:text-6xl font-extrabold tracking-tight mb-6">
                            Turn every incident into<br />
                            <span className="text-[#0891B2]">organizational learning.</span>
                        </h2>
                    </Reveal>
                    <Reveal delay={100}>
                        <p className="text-xl text-slate-500 mb-10">Connect investigations, attempted fixes, permanent remediation, and whether the fix actually lasted.</p>
                    </Reveal>
                    <Reveal delay={200}>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <Link href="/dashboard" className="inline-flex items-center gap-2 bg-[#0F172A] text-white font-semibold text-base px-8 py-4 rounded-xl shadow-lg hover:bg-[#0891B2] hover:-translate-y-0.5 transition-all">
                                Open RESOLVE
                            </Link>
                            <Link href="/incidents/INC-482" className="inline-flex items-center gap-2 text-base font-semibold text-slate-700 px-8 py-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:-translate-y-0.5 transition-all shadow-sm group">
                                Explore INC-482 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="bg-white border-t border-slate-200 py-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-sm text-slate-400 gap-4">
                    <div className="flex items-center gap-2 font-semibold text-slate-600">
                        <Activity className="w-4 h-4" /> RESOLVE &copy; {new Date().getFullYear()}
                    </div>
                    <div className="flex gap-7">
                        {['Documentation', 'Security', 'Terms'].map(l => <span key={l} className="hover:text-slate-700 cursor-pointer transition-colors">{l}</span>)}
                    </div>
                </div>
            </footer>
        </div>
    );
}

/* ─── Hero card inner content ───────────────────────────────────── */
function HeroCard() {
    const [step, setStep] = useState(0);
    useEffect(() => {
        const steps = [1, 2, 3, 4, 5, 6];
        const delays = [800, 2000, 3200, 4400, 5600, 7000];
        const timers = delays.map((d, i) => setTimeout(() => setStep(steps[i]), d));
        const reset = setTimeout(() => { setStep(0); }, 9500);
        return () => { timers.forEach(clearTimeout); clearTimeout(reset); };
    }, [step === 0 ? 0 : undefined]);

    const NodeBullet = ({ label, type, show, delay }: { label: string; type: 'incident' | 'historical' | 'cause' | 'failed' | 'success' | 'verify'; show: boolean; delay?: number }) => {
        const colors = { incident: '#3B82F6', historical: '#64748B', cause: '#D97706', failed: '#DC2626', success: '#16A34A', verify: '#0891B2' };
        return (
            <div className={`flex items-center gap-3 transition-all duration-500 ${show ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                style={{ transitionDelay: delay ? `${delay}ms` : undefined }}>
                <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: colors[type] }} />
                <span className="text-sm font-medium text-slate-700">{label}</span>
            </div>
        );
    };

    return (
        <div className="p-6 h-full flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Organizational Memory Network</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0891B2]">
                    <BrainCircuit className="w-4 h-4" /> Hindsight
                </div>
            </div>

            <div className="flex-1 space-y-3">
                <NodeBullet label="INC-482 — 503 errors ↑42%" type="incident" show={step >= 1} />
                <div className={`ml-4 pl-4 border-l-2 border-[#0891B2]/30 space-y-2 transition-all duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="text-[10px] font-bold text-[#0891B2] uppercase tracking-widest">Memory search…</div>
                </div>
                <NodeBullet label="INC-421 — Historical Match Found" type="historical" show={step >= 3} delay={100} />
                <div className={`ml-4 pl-4 border-l-2 border-slate-200 space-y-2 transition-all duration-500 ${step >= 4 ? 'opacity-100 translate-x-0' : 'opacity-0'}`}>
                    <NodeBullet label="Root cause: DB connection leak" type="cause" show={step >= 4} />
                </div>
                <div className={`ml-4 pl-4 border-l-2 border-slate-200 space-y-2 transition-all duration-500 ${step >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                    <NodeBullet label="Restart pods → Failed" type="failed" show={step >= 5} />
                    <NodeBullet label="Rollback v2.4.0 → Success" type="success" show={step >= 5} delay={200} />
                </div>
                <NodeBullet label="Verified: 147 days healthy" type="verify" show={step >= 6} />
            </div>

            <div className={`border-t border-slate-100 pt-3 flex items-center justify-between transition-opacity duration-700 ${step >= 6 ? 'opacity-100' : 'opacity-0'}`}>
                <span className="text-xs text-slate-400">Learning captured in organizational memory</span>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
        </div>
    );
}
