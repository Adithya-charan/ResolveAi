'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  AlertTriangle,
  History,
  BrainCircuit,
  ShieldCheck,
  Repeat,
  Server,
  Activity
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Active Incidents', href: '/incidents', icon: AlertTriangle },
  { name: 'Incident History', href: '/history', icon: History },
  { name: 'Resolution Memory', href: '/memory/resolution', icon: BrainCircuit },
  { name: 'Remediation Memory', href: '/memory/remediation', icon: ShieldCheck },
  { name: 'Recurrence Patterns', href: '/patterns', icon: Repeat },
  { name: 'Services', href: '/services', icon: Server },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex w-64 flex-col fixed inset-y-0 z-50 bg-resolve-surface border-r border-resolve-border">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-resolve-border space-x-3">
        <div className="bg-resolve-text-primary p-1.5 rounded-md">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <span className="font-semibold text-lg tracking-wide text-resolve-text-primary">RESOLVE</span>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-3 py-4">
          <div className="mb-4 px-3 flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-resolve-hindsight" />
            <span className="text-xs font-semibold text-resolve-hindsight uppercase tracking-wider">Hindsight ● Connected</span>
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={twMerge(
                  clsx(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-resolve-surface-secondary text-resolve-text-primary'
                      : 'text-resolve-text-secondary hover:bg-resolve-surface-secondary/50 hover:text-resolve-text-primary'
                  )
                )}
              >
                <item.icon
                  className={twMerge(
                    clsx(
                      'mr-3 h-5 w-5 shrink-0 transition-colors',
                      isActive ? 'text-resolve-text-primary' : 'text-resolve-text-muted group-hover:text-resolve-text-primary'
                    )
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-resolve-border">
          <div className="flex items-center">
            <img
              className="inline-block h-8 w-8 rounded-full bg-resolve-surface-secondary"
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="Avatar"
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-resolve-text-primary">SRE Lead</p>
              <p className="text-xs font-medium text-resolve-text-muted">Hackathon Team</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
