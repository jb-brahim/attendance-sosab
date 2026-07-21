'use client';

import { useTheme } from '@/lib/theme-context';
import { Menu, Sun, Moon } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export function Header({ title, onMenuClick, showMenu }: HeaderProps) {
  const { theme, toggle } = useTheme();

  return (
    <header className="bg-background/80 border-b border-border sticky top-0 z-40 backdrop-blur-md transition-colors duration-300">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          {showMenu && (
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 hover:bg-accent border border-transparent hover:border-border rounded-xl text-muted-foreground hover:text-foreground transition"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-foreground tracking-tight">{title}</h1>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* ── Language Switcher ── */}
          <LanguageSwitcher />

          {/* ── Theme Toggle ── */}
          <button
            onClick={toggle}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl hover:bg-accent border border-transparent hover:border-border text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
