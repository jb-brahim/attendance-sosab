'use client';

import { useState, useRef, useEffect } from 'react';
import { useI18n, type Locale } from '@/lib/i18n';
import { Globe, Check, ChevronDown } from 'lucide-react';

const LANGS: { code: Locale; label: string; short: string; flagName: string }[] = [
  { code: 'en', label: 'English', short: 'EN', flagName: 'English' },
  { code: 'fr', label: 'Français', short: 'FR', flagName: 'Français' },
  { code: 'ar', label: 'العربية', short: 'AR', flagName: 'العربية' },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = LANGS.find((l) => l.code === locale) || LANGS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/80 bg-card hover:bg-accent/60 text-foreground text-xs font-semibold transition-all duration-200 cursor-pointer shadow-xs"
        aria-expanded={open}
      >
        <Globe className="w-3.5 h-3.5 text-amber-500/90 flex-shrink-0" />
        <span className="uppercase tracking-wider font-bold text-[11px] text-foreground">{current.short}</span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Menu */}
      {open && (
        <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-36 rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md p-1 shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100 divide-y divide-border/40">
          <div className="py-0.5 space-y-0.5">
            {LANGS.map((lang) => {
              const isSelected = locale === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLocale(lang.code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span className="truncate">{lang.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
