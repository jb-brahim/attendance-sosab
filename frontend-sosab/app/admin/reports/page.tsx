'use client';

import { useEffect, useState, Fragment } from 'react';
import { Download, Calendar, Loader2, FileSpreadsheet, ChevronDown, ChevronUp, Clock, AlertCircle } from 'lucide-react';
import { attendanceAPI } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

/* ─── Display Helpers ─── */
function formatTitle(str: string) {
  if (!str) return '';
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function AdminReportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);
  const { t } = useI18n();

  // Set default dates on mount (start & end of current month)
  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    
    const start = new Date(y, m, 1).toISOString().split('T')[0];
    const end = new Date(y, m + 1, 0).toISOString().split('T')[0]; // last day of month
    
    setStartDate(start);
    setEndDate(end);
    
    // Auto-load reports for the current month
    fetchReport(start, end);
  }, []);

  const fetchReport = async (start = startDate, end = endDate) => {
    if (!start || !end) return;
    setLoading(true);
    setError(null);
    try {
      const response = await attendanceAPI.getReport(start, end);
      setReportData(response.data || []);
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      setError(err.response?.data?.error || 'Failed to generate attendance report.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport();
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) return;
    const headers = ['Worker Name', 'Position', 'Total Days Tracked', 'Present Days', 'Absent Days', 'Leave Days', 'Attendance Score %'];
    const rows = reportData.map((r: any) => [
      `"${r.worker.name}"`,
      `"${r.worker.jobRole}"`,
      r.metrics.totalDaysLogged,
      r.metrics.presentDays,
      r.metrics.absentDays,
      r.metrics.leaveDays || 0,
      r.metrics.attendancePercentage
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sosab_attendance_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExpandWorker = (id: string) => {
    setExpandedWorkerId(expandedWorkerId === id ? null : id);
  };

  return (
    <div className="space-y-8 p-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black font-heading text-foreground tracking-tight">{t('reports.title')}</h2>
          <p className="text-muted-foreground mt-1 font-medium">{t('reports.subtitle')}</p>
        </div>
        
        {reportData.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-600 hover:to-orange-600 font-bold px-5 py-3 rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-amber-500/10 text-sm uppercase tracking-wider self-start"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {t('reports.export')}
          </button>
        )}
      </div>

      {/* Date Filters Form */}
      <div className="glass-card rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row items-end gap-4">
          <div className="w-full sm:w-auto flex-1 space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('reports.startDate')}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl glass-input outline-none text-sm font-medium"
                required
              />
            </div>
          </div>

          <div className="w-full sm:w-auto flex-1 space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t('reports.endDate')}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl glass-input outline-none text-sm font-medium"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-card hover:bg-accent border border-border text-foreground font-semibold px-6 py-2.5 rounded-xl transition cursor-pointer text-sm"
          >
            {loading ? t('reports.generating') : t('reports.generate')}
          </button>
        </form>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-4 text-red-300 font-medium">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 bg-transparent space-y-3 min-h-[50vh]">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-muted-foreground text-sm font-semibold tracking-wide">{t('reports.loadingReport')}</p>
        </div>
      ) : reportData.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto text-slate-600 mb-2" />
          <p className="font-bold text-foreground text-lg">{t('reports.noData')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Aggregated Workers Sheet */}
          <div className="glass-card rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="text-lg font-bold text-foreground tracking-tight">Aggregated Attendance Sheets</h3>
              <p className="text-muted-foreground text-xs mt-0.5">Tapping a worker row displays their complete history in this range</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('reports.worker')}</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('workers.role')}</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">{t('reports.totalDays')}</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">{t('reports.presentDays')}</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">{t('reports.absentDays')}</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">{t('reports.lateDays')}</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">{t('reports.score')}</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reportData.map((row: any) => {
                    const isExpanded = expandedWorkerId === row.worker._id;
                    return (
                      <Fragment key={row.worker._id}>
                        {/* Main Row */}
                        <tr 
                          key={row.worker._id} 
                          onClick={() => toggleExpandWorker(row.worker._id)}
                          className="hover:bg-muted/20 transition duration-150 cursor-pointer"
                        >
                          <td className="px-6 py-4 text-sm font-bold text-foreground">{formatTitle(row.worker.name)}</td>
                          <td className="px-6 py-4 text-xs font-semibold text-amber-600 dark:text-amber-500/95">{formatTitle(row.worker.jobRole)}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground text-center font-semibold">{row.metrics.totalDaysLogged}</td>
                          <td className="px-6 py-4 text-sm text-emerald-600 dark:text-emerald-400 text-center font-semibold">{row.metrics.presentDays}</td>
                          <td className="px-6 py-4 text-sm text-rose-600 dark:text-rose-400 text-center font-semibold">{row.metrics.absentDays}</td>
                          <td className="px-6 py-4 text-sm text-amber-600 dark:text-amber-400/90 text-center font-semibold">{row.metrics.leaveDays || 0}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                              row.metrics.attendancePercentage >= 90
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : row.metrics.attendancePercentage >= 75
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                                  : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                            }`}>
                              {row.metrics.attendancePercentage}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-muted-foreground">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </td>
                        </tr>
                        
                        {/* Collapsible Logs History Sub-Table */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="bg-muted/30 p-4 border-b border-border">
                              <div className="border border-border overflow-hidden max-w-4xl mx-auto shadow-inner bg-card rounded-xl">
                                <div className="px-4 py-2.5 bg-muted/50 border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Chronological Daily logs for {row.worker.name}
                                </div>
                                <div className="max-h-60 overflow-y-auto divide-y divide-border">
                                  {row.history.length === 0 ? (
                                    <p className="p-4 text-xs text-muted-foreground text-center">No logs found in this range.</p>
                                  ) : (
                                    row.history.map((log: any) => (
                                      <div key={log.date} className="p-3 flex items-center justify-between text-xs gap-4">
                                        <div className="flex items-center gap-3">
                                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                          <span className="font-semibold text-foreground">{log.date}</span>
                                          <span className="text-border">|</span>
                                          <span className="text-muted-foreground italic">&ldquo;{log.notes || 'No comments'}&rdquo;</span>
                                        </div>
                                        
                                        <span className={`px-2.5 py-0.5 text-[9px] font-bold tracking-wider rounded-lg uppercase border ${
                                          log.status === 'present'
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                            : log.status === 'absent'
                                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                                              : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                                        }`}>
                                          {log.status}
                                        </span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
