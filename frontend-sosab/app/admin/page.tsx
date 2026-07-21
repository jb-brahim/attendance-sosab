'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Loader2, RefreshCw, HardHat,
} from 'lucide-react';
import { workerAPI, apiClient } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

/* ─── helpers ─── */
function toLocalYMD(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function isToday(d: Date) {
  return toLocalYMD(d) === toLocalYMD(new Date());
}
const LOCALE_MAP: Record<string, string> = {
  ar: 'ar-DZ',
  fr: 'fr-FR',
  en: 'en-GB',
};

function formatHeader(d: Date, t: (k: string) => string, locale: string) {
  if (isToday(d)) return t('dashboard.today');
  const diff = Math.round((d.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
  if (diff === -1) return t('dashboard.yesterday');
  if (diff === 1) return t('dashboard.tomorrow');
  return d.toLocaleDateString(LOCALE_MAP[locale] || 'en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}
function formatSub(d: Date, locale: string) {
  return d.toLocaleDateString(LOCALE_MAP[locale] || 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

interface WorkerRow {
  id: string;
  name: string;
  jobRole: string;
  status: 'present' | 'absent' | 'leave' | 'unmarked';
  notes: string;
  time: string;
}

export default function AdminOverviewPage() {
  const [day, setDay] = useState(new Date());
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({ present: 0, absent: 0, leave: 0, total: 0 });
  const { t, locale } = useI18n();

  const load = useCallback(async (d: Date, showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const dateStr = toLocalYMD(d);

      const [workerRes, dailyRes] = await Promise.allSettled([
        workerAPI.getAll(),
        apiClient.get(`/attendance/daily/${dateStr}`),
      ]);

      const allWorkers: any[] = workerRes.status === 'fulfilled'
        ? (workerRes.value.data.data || []).filter((w: any) => w.isActive)
        : [];

      const records: any[] = dailyRes.status === 'fulfilled'
        ? (dailyRes.value.data?.data || [])
        : [];

      // Build a map: workerId → attendance record
      const recordMap = new Map<string, any>();
      records.forEach((r: any) => {
        const wid = r.workerId?._id || r.workerId;
        if (wid) recordMap.set(String(wid), r);
      });

      const rows: WorkerRow[] = allWorkers.map((w: any) => {
        const rec = recordMap.get(String(w._id));
        return {
          id: w._id,
          name: w.name,
          jobRole: w.jobRole || '—',
          status: rec ? rec.status : 'unmarked',
          notes: rec?.notes || '',
          time: rec ? new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
        };
      });

      // Sort: present → leave → absent → unmarked
      const order = { present: 0, leave: 1, absent: 2, unmarked: 3 };
      rows.sort((a, b) => order[a.status] - order[b.status]);

      setWorkers(rows);
      setSummary({
        total: rows.length,
        present: rows.filter(r => r.status === 'present').length,
        absent: rows.filter(r => r.status === 'absent').length,
        leave: rows.filter(r => r.status === 'leave').length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(day); }, [day, load]);

  const goDay = (n: number) => setDay(prev => addDays(prev, n));

  function StatusBadge({ status }: { status: WorkerRow['status'] }) {
    const map = {
      present: { label: t('status.present'), dot: 'bg-emerald-500 dark:bg-emerald-400', pill: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
      absent: { label: t('status.absent'), dot: 'bg-rose-500 dark:bg-rose-400', pill: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400' },
      leave: { label: t('status.leave'), dot: 'bg-amber-500 dark:bg-amber-400', pill: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' },
      unmarked: { label: t('status.unmarked'), dot: 'bg-slate-400 dark:bg-slate-500', pill: 'bg-slate-500/10 border-slate-500/10 text-slate-500 dark:text-slate-400' },
    };
    const s = map[status];
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide border flex items-center gap-1.5 flex-shrink-0 ${s.pill}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-500/90 mb-1">{t('dashboard.adminConsole')}</p>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">{t('dashboard.dailyAttendance')}</h2>
        </div>
        <button
          onClick={() => load(day, true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-2 bg-secondary hover:bg-secondary/85 border border-border rounded-lg text-foreground text-xs font-medium transition duration-200 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>

      {/* ── Day navigator ── */}
      <div className="glass-card rounded-xl p-4 flex items-center justify-between gap-4">
        <button
          onClick={() => goDay(-1)}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted/50 hover:bg-accent border border-border text-muted-foreground hover:text-foreground transition cursor-pointer flex-shrink-0"
        >
          <ChevronLeft className="w-4.5 h-4.5 rtl:rotate-180" />
        </button>

        <div className="text-center flex-1">
          <p className="text-base font-semibold text-foreground">{formatHeader(day, t, locale)}</p>
          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{formatSub(day, locale)}</p>
        </div>

        <button
          onClick={() => goDay(1)}
          disabled={isToday(day)}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted/50 hover:bg-accent border border-border text-muted-foreground hover:text-foreground transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
        >
          <ChevronRight className="w-4.5 h-4.5 rtl:rotate-180" />
        </button>
      </div>


      {/* ── Workers attendance table ── */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground text-sm tracking-tight">{t('dashboard.activePers')}</h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              {isToday(day) ? t('dashboard.realtime') : `${t('dashboard.recordsFor')} ${formatHeader(day, t, locale).toLowerCase()}`}
            </p>
          </div>
          {isToday(day) && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('dashboard.liveFeed')}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
            <p className="text-muted-foreground text-xs font-medium">{t('dashboard.loadingRoster')}</p>
          </div>
        ) : workers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <HardHat className="w-7 h-7 text-slate-700" />
            <p className="text-muted-foreground text-xs font-medium">{t('dashboard.noPers')}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {workers.map((w) => (
              <div
                key={w.id}
                className={`flex items-center gap-4 px-5 py-3 hover:bg-muted/10 transition group ${
                  w.status === 'present' ? 'hover:border-l-2 hover:border-emerald-500/30' :
                  w.status === 'absent' ? 'hover:border-l-2 hover:border-rose-500/30' : ''
                }`}
              >
                {/* Left accent bar */}
                <div className={`w-1 h-7 rounded-full flex-shrink-0 ${
                  w.status === 'present' ? 'bg-emerald-500' :
                  w.status === 'absent' ? 'bg-rose-500' :
                  w.status === 'leave' ? 'bg-amber-500' :
                  'bg-muted'
                }`} />

                {/* Avatar */}
                <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground font-semibold text-xs flex-shrink-0">
                  {w.name.charAt(0).toUpperCase()}
                </div>

                {/* Name + role */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{w.name}</p>
                  <p className="text-xs text-muted-foreground">{w.jobRole}</p>
                </div>

                {/* Notes — hidden on mobile */}
                {w.notes && (
                  <p className="hidden lg:block text-xs text-muted-foreground italic truncate max-w-xs">
                    &ldquo;{w.notes}&rdquo;
                  </p>
                )}

                {/* Time */}
                <p className="text-xs text-muted-foreground font-mono flex-shrink-0 hidden sm:block">{w.time}</p>

                {/* Status badge */}
                <StatusBadge status={w.status} />
              </div>
            ))}
          </div>
        )}

        {/* Footer bar */}
        {!loading && workers.length > 0 && (
          <div className="px-5 py-3 border-t border-border flex items-center gap-4">
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden flex gap-0.5">
              <div
                className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                style={{ width: summary.total > 0 ? `${(summary.present / summary.total) * 100}%` : '0%' }}
              />
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: summary.total > 0 ? `${(summary.leave / summary.total) * 100}%` : '0%' }}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: summary.total > 0 ? `${(summary.absent / summary.total) * 100}%` : '0%' }}
              />
            </div>
            <p className="text-xs text-muted-foreground font-medium flex-shrink-0">
              {summary.present} {t('dashboard.presentOf')} {summary.total} {t('dashboard.present2')}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
