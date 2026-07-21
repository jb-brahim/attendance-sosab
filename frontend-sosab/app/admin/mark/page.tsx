'use client';

import { useEffect, useState } from 'react';
import {
  Check,
  X,
  Clock,
  LogOut,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { workerAPI, attendanceAPI, apiClient } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';
type SubType = 'normal' | 'late' | 'early';

interface WorkerAttendance {
  id: string;
  name: string;
  position: string;
  status: AttendanceStatus;
  subType: SubType;
  time: string;
  customNote: string;
}

/* ─── Display Helpers ─── */
function formatTitle(str: string) {
  if (!str) return '';
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function getInitials(name: string) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/20',
    'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20',
    'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20',
    'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-purple-500/20',
    'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/20',
    'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-cyan-500/20',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function toLocalYMD(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseExistingNotes(notes: string) {
  let time = '';
  let isLeftEarly = false;
  let customNote = notes || '';

  const lateMatch = notes?.match(/Arrived late at (\d{2}:\d{2})/i);
  if (lateMatch) {
    time = lateMatch[1];
    customNote = notes.replace(/Arrived late at \d{2}:\d{2}\s*(-)?\s*/i, '');
  }

  const earlyMatch = notes?.match(/Left early at (\d{2}:\d{2})/i);
  if (earlyMatch) {
    time = earlyMatch[1];
    isLeftEarly = true;
    customNote = notes.replace(/Left early at \d{2}:\d{2}\s*(-)?\s*/i, '');
  }

  return { time, isLeftEarly, customNote: customNote.trim() };
}

function buildNotesPayload(subType: SubType, time: string, customNote: string) {
  let prefix = '';
  if (subType === 'late' && time) {
    prefix = `Arrived late at ${time}`;
  } else if (subType === 'early' && time) {
    prefix = `Left early at ${time}`;
  }

  if (prefix && customNote) {
    return `${prefix} - ${customNote}`;
  }
  return prefix || customNote || '';
}

export default function AdminMarkAttendancePage() {
  const [workers, setWorkers] = useState<WorkerAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [savingWorkerId, setSavingWorkerId] = useState<string | null>(null);
  const [showOptionsMap, setShowOptionsMap] = useState<Record<string, boolean>>({});
  const { t } = useI18n();

  const formattedDate = selectedDate.toLocaleDateString('fr-DZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const toggleOptions = (workerId: string) => {
    setShowOptionsMap(prev => ({
      ...prev,
      [workerId]: !prev[workerId],
    }));
  };

  const fetchWorkers = async (date: Date) => {
    try {
      setLoading(true);
      setError(null);
      
      const dateYMD = toLocalYMD(date);

      const [workerRes, dailyRes] = await Promise.all([
        workerAPI.getAll(),
        apiClient.get(`/attendance/daily/${dateYMD}`),
      ]);

      const active = (workerRes.data.data || []).filter((w: any) => w.isActive);
      const records = dailyRes.data?.data || [];

      const recordMap = new Map<string, { status: string; notes: string }>();
      records.forEach((r: any) => {
        const wid = r.workerId?._id || r.workerId;
        if (wid) {
          recordMap.set(String(wid), {
            status: r.status || 'absent',
            notes: r.notes || '',
          });
        }
      });

      const initializedWorkers = active.map((w: any) => {
        const existing = recordMap.get(String(w._id));
        const rawStatus = (existing?.status as AttendanceStatus) || 'absent';
        const rawNotes = existing?.notes || '';
        const parsed = parseExistingNotes(rawNotes);

        let subType: SubType = 'normal';
        if (rawStatus === 'late' || (parsed.time && !parsed.isLeftEarly)) {
          subType = 'late';
        } else if (parsed.isLeftEarly) {
          subType = 'early';
        }

        const now = new Date();
        const defaultTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        return {
          id: w._id,
          name: w.name,
          position: w.jobRole || '—',
          status: rawStatus,
          subType,
          time: parsed.time || defaultTime,
          customNote: parsed.customNote,
        };
      });

      setWorkers(initializedWorkers);

      // Auto-initialize unmarked workers as 'absent' in database
      const unmarkedWorkers = active.filter((w: any) => !recordMap.has(String(w._id)));
      if (unmarkedWorkers.length > 0) {
        attendanceAPI.markAttendance({
          date: dateYMD,
          records: unmarkedWorkers.map((w: any) => ({
            workerId: w._id,
            status: 'absent',
            notes: '',
          })),
        }).catch(err => {
          console.error('Failed to auto-initialize unmarked workers as absent:', err);
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load workers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers(selectedDate);
  }, [selectedDate]);

  const saveAttendanceRecord = async (
    workerId: string,
    newStatus: AttendanceStatus,
    newSubType: SubType,
    newTime: string,
    newNote: string
  ) => {
    setSavingWorkerId(workerId);
    try {
      const dateYMD = toLocalYMD(selectedDate);
      const notesPayload = buildNotesPayload(newSubType, newTime, newNote);
      
      let dbStatus: AttendanceStatus = newStatus;
      if (newSubType === 'late') {
        dbStatus = 'late';
      } else if (newSubType === 'early') {
        dbStatus = 'present';
      }

      await attendanceAPI.markAttendance({
        date: dateYMD,
        records: [{
          workerId,
          status: dbStatus,
          notes: notesPayload,
        }],
      });
      
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save attendance change.');
    } finally {
      setSavingWorkerId(null);
    }
  };

  const handleSelectOption = (workerId: string, subType: SubType) => {
    setWorkers(prev => prev.map(w => {
      if (w.id !== workerId) return w;
      
      let newStatus: AttendanceStatus = 'present';
      if (subType === 'late') newStatus = 'late';
      else if (subType === 'early') newStatus = 'present';
      else if (subType === 'normal') newStatus = 'present';

      const updated = {
        ...w,
        status: newStatus,
        subType,
      };

      saveAttendanceRecord(workerId, newStatus, subType, updated.time, updated.customNote);
      return updated;
    }));
  };

  const handleSimpleStatusChange = (workerId: string, status: AttendanceStatus) => {
    setWorkers(prev => prev.map(w => {
      if (w.id !== workerId) return w;
      const updated = {
        ...w,
        status,
        subType: 'normal' as SubType,
      };
      saveAttendanceRecord(workerId, status, 'normal', updated.time, updated.customNote);
      return updated;
    }));
  };

  const handleTimeChange = (workerId: string, newTime: string) => {
    setWorkers(prev => prev.map(w => {
      if (w.id !== workerId) return w;
      const updated = { ...w, time: newTime };
      saveAttendanceRecord(workerId, updated.status, updated.subType, newTime, updated.customNote);
      return updated;
    }));
  };

  const handleNoteChange = (workerId: string, newNote: string) => {
    setWorkers(prev => prev.map(w => {
      if (w.id !== workerId) return w;
      return { ...w, customNote: newNote };
    }));
  };

  const handleNoteBlur = (worker: WorkerAttendance) => {
    saveAttendanceRecord(worker.id, worker.status, worker.subType, worker.time, worker.customNote);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <p className="text-muted-foreground text-sm font-semibold tracking-wide">{t('mark.loadingLog')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-1">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-foreground tracking-tight">
            {t('mark.title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('mark.subtitle')}
          </p>
        </div>

        {/* Date Selector */}
        <div className="relative">
          <button
            onClick={() => {
              const input = document.getElementById('attendance-date-picker') as HTMLInputElement;
              if (input) {
                if (typeof input.showPicker === 'function') {
                  input.showPicker();
                } else {
                  input.click();
                }
              }
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-card hover:bg-muted/40 border border-border/80 rounded-2xl text-foreground text-xs font-bold transition cursor-pointer shadow-sm"
          >
            <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="capitalize">{formattedDate}</span>
          </button>
          <input
            id="attendance-date-picker"
            type="date"
            value={toLocalYMD(selectedDate)}
            onChange={(e) => {
              if (e.target.value) {
                const parts = e.target.value.split('-');
                const localDate = new Date(
                  parseInt(parts[0], 10),
                  parseInt(parts[1], 10) - 1,
                  parseInt(parts[2], 10)
                );
                setSelectedDate(localDate);
              }
            }}
            className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none"
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-600 dark:text-rose-300 font-medium flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Workers Attendance Cards */}
      {workers.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground border border-border/70">
          <AlertCircle className="w-12 h-12 mx-auto text-slate-500 mb-3" />
          <p className="font-bold text-foreground text-lg">{t('mark.noWorkers')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('mark.noWorkersHint')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {workers.map((worker) => {
            const isPresent = worker.status === 'present' && worker.subType === 'normal';
            const isLate = worker.subType === 'late';
            const isEarly = worker.subType === 'early';
            const isAbsent = worker.status === 'absent';
            const showOptions = showOptionsMap[worker.id];

            const formattedName = formatTitle(worker.name);
            const formattedRole = formatTitle(worker.position);
            const initials = getInitials(worker.name);
            const avatarColorClass = getAvatarColor(worker.name);
            const isSaving = savingWorkerId === worker.id;

            return (
              <div
                key={worker.id}
                className={`glass-card rounded-2xl border p-4 transition-all duration-200 shadow-sm ${
                  isLate
                    ? 'border-amber-500/40 bg-amber-500/[0.02]'
                    : isEarly
                    ? 'border-orange-500/40 bg-orange-500/[0.02]'
                    : isPresent
                    ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                    : isAbsent
                    ? 'border-rose-500/30 bg-rose-500/[0.02]'
                    : 'border-blue-500/30 bg-blue-500/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Worker Profile */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl ${avatarColorClass} flex items-center justify-center font-black text-xs tracking-wider flex-shrink-0 shadow-sm`}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground text-sm tracking-tight truncate">{formattedName}</h3>
                        
                        {isLate && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Late ({worker.time})
                          </span>
                        )}
                        {isEarly && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 flex items-center gap-1">
                            <LogOut className="w-3 h-3" />
                            Left Early ({worker.time})
                          </span>
                        )}
                        {isSaving && <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />}
                      </div>
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400/90 mt-0.5 truncate">{formattedRole}</p>
                    </div>
                  </div>

                  {/* Clean Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* PRESENT BUTTON */}
                    <button
                      type="button"
                      onClick={() => handleSelectOption(worker.id, 'normal')}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                        isPresent
                          ? 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/20 scale-105'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                      }`}
                      title={t('mark.markPresent')}
                    >
                      <Check className="w-5 h-5" strokeWidth={3} />
                    </button>

                    {/* ABSENT BUTTON */}
                    <button
                      type="button"
                      onClick={() => handleSimpleStatusChange(worker.id, 'absent')}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                        isAbsent
                          ? 'bg-rose-500 border-rose-400 text-white shadow-md shadow-rose-500/20 scale-105'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25'
                      }`}
                      title={t('mark.markAbsent')}
                    >
                      <X className="w-5 h-5" strokeWidth={3} />
                    </button>

                    {/* CUSTOM TIME & OPTIONS BUTTON (Clock Icon) */}
                    <button
                      type="button"
                      onClick={() => toggleOptions(worker.id)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                        isLate || isEarly || showOptions
                          ? 'bg-amber-500 border-amber-400 text-white shadow-md shadow-amber-500/20'
                          : 'bg-muted/60 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      title={t('mark.customOptions')}
                    >
                      <Clock className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* Expandable Custom Details Bar */}
                {(showOptions || isLate || isEarly) && (
                  <div className="mt-3.5 pt-3.5 border-t border-border/60 space-y-3 animate-in fade-in-50 duration-150">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('mark.selectDetails')}</span>
                      
                      <button
                        type="button"
                        onClick={() => handleSelectOption(worker.id, 'late')}
                        className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer border ${
                          isLate
                            ? 'bg-amber-500 border-amber-400 text-white'
                            : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        ⏱ {t('mark.cameLate')}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectOption(worker.id, 'early')}
                        className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer border ${
                          isEarly
                            ? 'bg-orange-500 border-orange-400 text-white'
                            : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        🚪 {t('mark.leftEarly')}
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      {(isLate || isEarly) && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                            {isLate ? t('mark.arrivalTime') : t('mark.departureTime')}
                          </span>
                          <input
                            type="time"
                            value={worker.time}
                            onChange={(e) => handleTimeChange(worker.id, e.target.value)}
                            className="px-3 py-1.5 rounded-xl glass-input outline-none text-xs font-bold text-foreground cursor-pointer border border-border/80 focus:border-amber-500 h-9"
                          />
                        </div>
                      )}

                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          placeholder={t('mark.addNote')}
                          value={worker.customNote}
                          onChange={(e) => handleNoteChange(worker.id, e.target.value)}
                          onBlur={() => handleNoteBlur(worker)}
                          className="w-full px-3 py-1.5 rounded-xl glass-input outline-none text-xs font-medium border border-border/80 focus:border-amber-500 h-9"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
