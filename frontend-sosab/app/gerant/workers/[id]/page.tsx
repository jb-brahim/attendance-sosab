'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { workerAPI, attendanceAPI } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

/* ── Types ── */
interface DayRecord { date: string; status: string; notes?: string; }
interface Metrics {
  totalDaysLogged: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendancePercentage: number;
}

/* ── Helpers ── */
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



/* ── Page ── */
export default function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();

  const [worker, setWorker] = useState<any>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [history, setHistory] = useState<DayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [wRes] = await Promise.all([workerAPI.getAll()]);
        const all: any[] = wRes.data.data || [];
        const found = all.find((w: any) => w._id === id);
        if (!found) { setError('Worker not found.'); setLoading(false); return; }
        setWorker(found);

        const today = new Date();
        const end = today.toISOString().split('T')[0];
        const d90 = new Date(); d90.setDate(d90.getDate() - 90);
        const start = d90.toISOString().split('T')[0];
        const hRes = await attendanceAPI.getWorkerHistory(id, start, end);
        setMetrics(hRes.data.metrics);
        setHistory(hRes.data.history || []);
      } catch (e: any) {
        setError(e.response?.data?.error || 'Failed to load worker data.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        <span className="text-sm">{t('workerDetail.loadingProfile')}</span>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="max-w-2xl mx-auto pt-12">
        <div className="flex items-center gap-2.5 text-sm text-rose-600 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error || t('workerDetail.workerNotFound')}
        </div>
      </div>
    );
  }



  const color = avatarColor(worker.name);
  const initials = getInitials(worker.name);




  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('common.backToDirectory')}
      </button>

      {/* Profile Header */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-5 shadow-sm">
        <div className={`w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl font-bold text-white ${color}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-foreground tracking-tight">{formatTitle(worker.name)}</h1>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${worker.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
            {worker.isActive ? t('common.active') : t('common.inactive')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{formatTitle(worker.jobRole)}</p>

          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-muted-foreground">
            {worker.phone && (
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{worker.phone}</span>
            )}
            {worker.email && (
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{worker.email}</span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(worker.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Table */}
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">{t('workerDetail.metric')}</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">{t('workerDetail.value')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            <tr className="hover:bg-muted/20 transition">
              <td className="px-5 py-3 text-sm text-muted-foreground">{t('workerDetail.daysPresent')}</td>
              <td className="px-5 py-3 text-right font-semibold text-sm text-emerald-600 dark:text-emerald-400">{metrics?.presentDays ?? 0}</td>
            </tr>
            <tr className="hover:bg-muted/20 transition">
              <td className="px-5 py-3 text-sm text-muted-foreground">{t('workerDetail.daysAbsent')}</td>
              <td className="px-5 py-3 text-right font-semibold text-sm text-rose-600 dark:text-rose-400">{metrics?.absentDays ?? 0}</td>
            </tr>
            <tr className="hover:bg-muted/20 transition">
              <td className="px-5 py-3 text-sm text-muted-foreground">{t('workerDetail.cameLate')}</td>
              <td className="px-5 py-3 text-right font-semibold text-sm text-foreground">{metrics?.lateDays ?? 0}</td>
            </tr>
            <tr className="hover:bg-muted/20 transition">
              <td className="px-5 py-3 text-sm text-muted-foreground">{t('workerDetail.daysLogged')}</td>
              <td className="px-5 py-3 text-right font-semibold text-sm text-foreground">{metrics?.totalDaysLogged ?? 0}</td>
            </tr>
          </tbody>
        </table>
      </div>




      {/* Recent Records Table */}
      {history.length > 0 && (
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-border/60 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{t('workerDetail.recentRecords')}</p>
            <span className="text-xs text-muted-foreground">{t('common.lastNDays')}</span>
          </div>
          <div className="divide-y divide-border/50 max-h-72 overflow-y-auto">
            {history.slice().reverse().map((log, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 text-xs hover:bg-muted/20 transition">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-muted-foreground">{log.date}</span>
                  {log.notes && (
                    <span className="text-muted-foreground italic truncate max-w-[200px]">{log.notes}</span>
                  )}
                </div>
                <span className={`px-2.5 py-0.5 rounded-md font-semibold border capitalize text-[10px] ${
                  log.status === 'present' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                  log.status === 'absent'  ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400' :
                  log.status === 'late'    ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400' :
                                             'bg-muted text-muted-foreground border-border'
                }`}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
