'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { useProtectedRoute } from '@/lib/use-protected-route';
import { useI18n } from '@/lib/i18n';
import {
  Home,
  BarChart3,
  Users,
  UserCheck,
  Settings,
  Loader2,
  Clock,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoading } = useProtectedRoute(['admin']);
  const { t } = useI18n();

  const adminNavItems = [
    { label: t('nav.overview'), href: '/admin', icon: Home },
    { label: t('nav.markAttendance'), href: '/admin/mark', icon: Clock },
    { label: t('nav.reports'), href: '/admin/reports', icon: BarChart3 },
    { label: t('nav.workers'), href: '/admin/workers', icon: Users },
    { label: t('nav.users'), href: '/admin/users', icon: UserCheck },
    { label: t('nav.settings'), href: '/admin/settings', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        items={adminNavItems}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={t('dashboard.adminConsole')}
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
