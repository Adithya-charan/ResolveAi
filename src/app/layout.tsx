import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'RESOLVE | Incident Response That Remembers',
  description: 'AI-powered Incident Response Agent that uses Hindsight as long-term organizational memory.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-resolve-bg">
      <body className={`${inter.variable} h-full antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
