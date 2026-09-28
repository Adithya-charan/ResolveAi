'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { usePathname } from 'next/navigation';

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLanding = pathname === '/';

    if (isLanding) {
        return <div className="min-h-screen bg-resolve-bg">{children}</div>;
    }

    return (
        <div className="min-h-screen bg-resolve-bg flex flex-col">
            <Sidebar />
            <div className="pl-64 flex flex-col flex-1">
                <Header />
                <main className="flex-1">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
