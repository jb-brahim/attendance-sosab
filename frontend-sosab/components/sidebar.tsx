'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { LucideIcon, X, HardHat, Settings, LogOut } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: NavItem[];
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ items, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, isRTL } = useI18n();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
    if (onClose) onClose();
  };

  const settingsHref = user?.role === 'admin' ? '/admin/settings' : '/gerant/settings';

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden z-30 transition-all duration-350"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          'fixed md:static inset-y-0 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 ease-in-out z-40',
          isRTL
            ? 'right-0 border-l border-sidebar-border'
            : 'left-0 border-r border-sidebar-border',
          isOpen
            ? 'translate-x-0'
            : isRTL
            ? 'translate-x-full md:translate-x-0'
            : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-sidebar-border relative bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.03)_0%,transparent_80%)]">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 group-hover:border-amber-500/40 transition duration-300">
                <HardHat className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-md font-semibold tracking-wider text-foreground">SOSAB</span>
                <span className="text-[9px] block text-amber-500/80 tracking-widest font-semibold uppercase -mt-0.5">Operations</span>
              </div>
            </Link>
            
            <button
              onClick={onClose}
              className="md:hidden p-1.5 hover:bg-sidebar-accent/50 border border-transparent hover:border-sidebar-border rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <ul className="space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 relative group cursor-pointer text-sm font-medium',
                      isActive
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <Icon className={cn(
                      'w-4.5 h-4.5 flex-shrink-0 transition-transform duration-200 group-hover:scale-102',
                      isActive ? 'text-amber-400' : 'text-sidebar-foreground/45 group-hover:text-sidebar-foreground/75'
                    )} />
                    
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Actions */}
        <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
          {/* Settings */}
          <Link
            href={settingsHref}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 relative group cursor-pointer text-sm font-medium',
              pathname === settingsHref
                ? 'bg-amber-500/10 text-amber-400'
                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <Settings className={cn(
              'w-4.5 h-4.5 flex-shrink-0 transition-transform duration-200 group-hover:scale-102',
              pathname === settingsHref ? 'text-amber-400' : 'text-sidebar-foreground/45 group-hover:text-sidebar-foreground/75'
            )} />
            <span className="relative z-10">{t('nav.settings')}</span>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-red-400/90 hover:bg-red-500/10 hover:text-red-400 cursor-pointer text-sm font-medium group",
              isRTL ? "text-right" : "text-left"
            )}
          >
            <LogOut className="w-4.5 h-4.5 flex-shrink-0 text-red-400/70 group-hover:text-red-400 transition-colors" />
            <span className="relative z-10">{t('nav.signOut')}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar/30">
          <p className="text-[10px] text-sidebar-foreground/45 font-medium text-center tracking-wider">
            SOSAB Portal v2.4
          </p>
        </div>
      </aside>
    </>
  );
}
