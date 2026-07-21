'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
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

const PALETTES = [
  { bg: 'bg-amber-500',   text: 'text-white' },
  { bg: 'bg-blue-600',    text: 'text-white' },
  { bg: 'bg-emerald-600', text: 'text-white' },
  { bg: 'bg-violet-600',  text: 'text-white' },
  { bg: 'bg-rose-600',    text: 'text-white' },
  { bg: 'bg-cyan-600',    text: 'text-white' },
];

function getAvatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', position: '' });
  const [saving, setSaving] = useState(false);
  const { t } = useI18n();

  const fetchWorkers = async () => {
    try {
      const res = await workerAPI.getAll();
      setWorkers(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load workers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkers(); }, []);

  const filtered = workers.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.email && w.email.toLowerCase().includes(search.toLowerCase())) ||
    w.jobRole.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingWorker(null);
    setFormData({ name: '', email: '', phone: '', position: '' });
    setShowModal(true);
  };

  const openEdit = (worker: any) => {
    setEditingWorker(worker);
    setFormData({ name: worker.name, email: worker.email || '', phone: worker.phone || '', position: worker.jobRole });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingWorker(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingWorker) {
        await workerAPI.update(editingWorker._id, { ...formData, isActive: editingWorker.isActive });
      } else {
        await workerAPI.create(formData);
      }
      closeModal();
      fetchWorkers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('workers.deleteConfirm'))) return;
    try { await workerAPI.delete(id); fetchWorkers(); }
    catch (err: any) { alert(err.response?.data?.error || t('common.error')); }
  };

  const activeCount = workers.filter(w => w.isActive).length;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">{t('workers.registryTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeCount} {t('workers.activeTotal')} · {workers.length} {t('workers.total')}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-xl transition shadow-sm shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t('workers.addWorker')}
        </button>
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
        <div className="flex items-center gap-2.5 text-sm text-rose-600 dark:text-rose-400 bg-rose-500/8 border border-rose-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
          <span className="text-sm">{t('workers.loadingRegistry')}</span>
        </div>
      ) : (
        <div className="border border-border/60 rounded-2xl overflow-hidden bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">{t('workers.employee')}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">{t('workers.role')}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground hidden sm:table-cell">{t('workers.contact')}</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">{t('workers.status')}</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">{t('workers.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-muted-foreground text-sm">
                      {search ? t('workers.noSearch') : t('workers.noWorkers')}
                    </td>
                  </tr>
                ) : filtered.map(worker => {
                  const palette = getAvatarPalette(worker.name);
                  const initials = getInitials(worker.name);
                  return (
                    <tr key={worker._id} className="hover:bg-muted/20 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${palette.bg} ${palette.text}`}>
                            {initials}
                          </div>
                          <span className="font-medium text-foreground">{formatTitle(worker.name)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs">{formatTitle(worker.jobRole)}</td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs hidden sm:table-cell">
                        <div className="space-y-0.5">
                          {worker.phone && <div>{worker.phone}</div>}
                          {worker.email && <div>{worker.email}</div>}
                          {!worker.phone && !worker.email && <span>—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${worker.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${worker.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {worker.isActive ? t('common.active') : t('common.inactive')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/workers/${worker._id}`)}
                            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-amber-500 transition cursor-pointer"
                            title="View Details"
                          >
                            {t('common.view')} <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => openEdit(worker)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(worker._id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-foreground mb-5">
              {editingWorker ? t('workers.editEmployee') : t('workers.addEmployee')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {[
                { label: t('workers.fullName'), key: 'name', type: 'text', required: true, placeholder: t('workers.namePlaceholder') },
                { label: t('workers.jobRole'), key: 'position', type: 'text', required: true, placeholder: t('workers.rolePlaceholder') },
                { label: t('workers.phone'), key: 'phone', type: 'tel', required: false, placeholder: t('workers.phonePlaceholder') },
                { label: t('workers.email'), key: 'email', type: 'email', required: false, placeholder: t('workers.emailPlaceholder') },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={(formData as any)[field.key]}
                    onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input outline-none border border-border/70 focus:border-amber-500/50 transition"
                  />
                </div>
              ))}

              {editingWorker && (
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingWorker.isActive}
                    onChange={e => setEditingWorker({ ...editingWorker, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-amber-500 cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">{t('workers.activeEmployee')}</span>
                </label>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 text-sm font-medium text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl transition cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-xl transition shadow-sm cursor-pointer"
                >
                  {saving ? t('workers.saving') : editingWorker ? t('common.saveChanges') : t('workers.addBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
