'use client';

import { useEffect, useState, Fragment } from 'react';
import { Calendar, Loader2, FileSpreadsheet, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { attendanceAPI } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

/* ─── Helpers for date conversions & formatting ─── */
function formatTitle(str: string) {
  if (!str) return '';
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function toLocalYMD(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekStartAndEnd(weekStr: string) {
  if (!weekStr) return { start: '', end: '' };
  const parts = weekStr.match(/^(\d{4})-W(\d{2})$/);
  if (!parts) return { start: '', end: '' };
  const year = parseInt(parts[1], 10);
  const week = parseInt(parts[2], 10);
  
  const jan1 = new Date(year, 0, 1);
  const jan1Day = jan1.getDay();
  const correction = jan1Day <= 4 ? jan1Day - 1 : jan1Day - 8;
  
  const start = new Date(year, 0, 1 + (week - 1) * 7 - correction);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  return {
    start: toLocalYMD(start),
    end: toLocalYMD(end)
  };
}

function getDatesFromMonth(monthStr: string) {
  if (!monthStr) return { start: '', end: '' };
  const [yearStr, monthStr2] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr2, 10);
  
  const start = `${yearStr}-${monthStr2}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${yearStr}-${monthStr2}-${String(lastDay).padStart(2, '0')}`;
  
  return { start, end };
}

function getCurrentWeekStr(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export default function GerantReportsPage() {
  const [reportType, setReportType] = useState<'week' | 'month' | 'custom'>('month');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    
    const currentMonthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
    setSelectedMonth(currentMonthStr);
    
    const currentWeekStr = getCurrentWeekStr(today);
    setSelectedWeek(currentWeekStr);
    
    const start = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const end = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    setStartDate(start);
    setEndDate(end);
    
    console.log('Mount: fetching report for default month range:', start, 'to', end);
    fetchReport(start, end);
  }, []);

  const fetchReport = async (start = startDate, end = endDate) => {
    console.log('fetchReport called with start:', start, 'end:', end);
    if (!start || !end) {
      console.warn('fetchReport aborted: start or end date is missing');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('Sending API request to /attendance/report with params:', { startDate: start, endDate: end });
      const response = await attendanceAPI.getReport(start, end);
      console.log('API response received, records count:', response.data?.length || 0);
      setReportData(response.data || []);
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      setError(err.response?.data?.error || 'Failed to generate attendance report.');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: 'week' | 'month' | 'custom') => {
    setReportType(type);
    console.log('Report type changed to:', type);
    if (type === 'week') {
      const { start, end } = getWeekStartAndEnd(selectedWeek);
      console.log('Weekly range synced from', selectedWeek, ':', start, 'to', end);
      if (start && end) {
        setStartDate(start);
        setEndDate(end);
      }
    } else if (type === 'month') {
      const { start, end } = getDatesFromMonth(selectedMonth);
      console.log('Monthly range synced from', selectedMonth, ':', start, 'to', end);
      if (start && end) {
        setStartDate(start);
        setEndDate(end);
      }
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submit triggered. Active reportType:', reportType, 'Querying range:', startDate, 'to', endDate);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">{t('reports.title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('reports.subtitle')}</p>
        </div>
        
        {reportData.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-lg transition duration-200 cursor-pointer text-xs self-start"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {t('reports.export')}
          </button>
        )}
      </div>

      {/* Report Range Selector Form */}
      <div className="glass-card rounded-xl p-5 shadow-sm">
        <form onSubmit={handleGenerate} className="flex flex-col lg:flex-row lg:items-end gap-5">
          {/* Segmented Control for Period Type */}
          <div className="space-y-1.5 flex-shrink-0">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Report Period
            </label>
            <div className="flex bg-muted/50 border border-border p-1 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => handleTypeChange('week')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  reportType === 'week' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('month')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  reportType === 'month' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('custom')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  reportType === 'custom' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Dynamic Range Inputs */}
          {reportType === 'week' && (
            <div className="w-full sm:w-auto flex-1 space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Select Week
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="week"
                  value={selectedWeek}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedWeek(val);
                    const { start, end } = getWeekStartAndEnd(val);
                    if (start && end) {
                      setStartDate(start);
                      setEndDate(end);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 rounded-lg glass-input outline-none text-sm font-medium cursor-pointer h-9"
                  required
                />
              </div>
            </div>
          )}

          {reportType === 'month' && (
            <div className="w-full sm:w-auto flex-1 space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Select Month
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedMonth(val);
                    const { start, end } = getDatesFromMonth(val);
                    if (start && end) {
                      setStartDate(start);
                      setEndDate(end);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 rounded-lg glass-input outline-none text-sm font-medium cursor-pointer h-9"
                  required
                />
              </div>
            </div>
          )}

          {reportType === 'custom' && (
            <>
              <div className="w-full sm:w-auto flex-1 space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg glass-input outline-none text-sm font-medium cursor-pointer h-9"
                    required
                  />
                </div>
              </div>

              <div className="w-full sm:w-auto flex-1 space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg glass-input outline-none text-sm font-medium cursor-pointer h-9"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full lg:w-auto bg-secondary hover:bg-secondary/85 border border-border text-foreground font-medium px-4 py-2 rounded-lg transition duration-200 cursor-pointer text-xs h-9 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Report'}
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
          <p className="text-muted-foreground text-sm font-semibold tracking-wide">Aggregating attendance databases...</p>
        </div>
      ) : reportData.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto text-slate-600 mb-2" />
          <p className="font-bold text-foreground text-lg">No records found in this range.</p>
          <p className="text-sm text-muted-foreground mt-1">Try selecting a different start or end date.</p>
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
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Employee</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Position</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Days logged</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Present</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Absent</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Leave</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Score</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reportData.map((row: any) => {
                    const isExpanded = expandedWorkerId === row.worker._id;
                    return (
                      <Fragment key={row.worker._id}>
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
