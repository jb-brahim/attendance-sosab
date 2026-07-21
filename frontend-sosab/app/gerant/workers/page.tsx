'use client';

import { useEffect, useState } from 'react';
import { Search, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { workerAPI } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

function formatTitle(str: string) {
  if (!str) return '';
  return str.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function getInitials(name: string) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const PALETTES = ['bg-amber-500', 'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-rose-600', 'bg-cyan-600'];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return PALETTES[Math.abs(h) % PALETTES.length];
}

export default function GerantWorkersPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await workerAPI.getAll();
        setWorkers(res.data.data || []);
      } catch (e: any) {
        setError(e.response?.data?.error || 'Failed to load workers.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = workers.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.jobRole.toLowerCase().includes(search.toLowerCase()) ||
    (w.email && w.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">{t('workers.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {workers.filter(w => w.isActive).length} {t('workers.activeTotal')} · {workers.length} {t('workers.total')}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder={t('workers.searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl glass-input outline-none border border-border/70 focus:border-amber-500/50 transition"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 text-sm text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
          <span className="text-sm">{t('workers.loadingRegistry')}</span>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-20 text-sm text-muted-foreground">
          {search ? t('workers.noSearch') : t('workers.noWorkers')}
        </p>
      ) : (
        <div className="border border-border/60 rounded-2xl overflow-hidden bg-card shadow-sm divide-y divide-border/50">
          {filtered.map(worker => (
            <div key={worker._id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition group">
              {/* Identity */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${avatarColor(worker.name)}`}>
                  {getInitials(worker.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{formatTitle(worker.name)}</p>
                  <p className="text-xs text-muted-foreground truncate">{formatTitle(worker.jobRole)}</p>
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                <span className={`hidden sm:flex items-center gap-1.5 text-[11px] font-medium ${worker.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${worker.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {worker.isActive ? t('common.active') : t('common.inactive')}
                </span>

                <button
                  onClick={() => router.push(`/gerant/workers/${worker._id}`)}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-amber-500 transition cursor-pointer"
                >
                  {t('workers.viewDetails')}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
