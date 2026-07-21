'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { useProtectedRoute } from '@/lib/use-protected-route';
import { useI18n } from '@/lib/i18n';
import {
  Home,
  Users,
  Loader2,
  BarChart3,
} from 'lucide-react';

export default function GerantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoading } = useProtectedRoute(['gerant']);
  const { t } = useI18n();

  const gerantNavItems = [
    { label: t('nav.overview'), href: '/gerant', icon: Home },
    { label: t('nav.reports'), href: '/gerant/reports', icon: BarChart3 },
    { label: t('nav.workers'), href: '/gerant/workers', icon: Users },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        items={gerantNavItems}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={t('dashboard.siteManager')}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          showMenu={true}
        />
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
