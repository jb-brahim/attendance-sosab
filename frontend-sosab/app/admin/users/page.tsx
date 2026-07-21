'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search, Loader2, AlertCircle, Shield } from 'lucide-react';
import { userAPI } from '@/lib/api';
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'gerant',
  });
  const { t } = useI18n();

  const fetchUsers = async () => {
    try {
      setError(null);
      const response = await userAPI.getAll();
      setUsers(response.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.response?.data?.error || 'Failed to fetch system users. Ensure the server is online.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('users.deleteConfirm'))) {
      try {
        await userAPI.delete(id);
        fetchUsers();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to delete user account');
      }
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'gerant' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await userAPI.update(editingUser._id, formData);
      } else {
        // Creates user with a default password of 'Password123!'
        await userAPI.create(formData);
      }
      handleCancel();
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save user account');
    }
  };

  return (
    <div className="space-y-8 p-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black font-heading text-foreground tracking-tight">{t('users.title')}</h2>
          <p className="text-muted-foreground mt-1 font-medium">{t('users.subtitle')}</p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-600 hover:to-orange-600 font-bold px-5 py-3 rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-amber-500/10 text-sm uppercase tracking-wider self-start"
        >
          <Plus className="w-5 h-5" />
          {t('users.addUser')}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
        <input
          type="text"
          placeholder={t('users.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl glass-input outline-none text-sm font-medium shadow-md"
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-4 text-red-300 font-medium flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}


      {/* Users Table or Loader */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 bg-transparent space-y-3 min-h-[50vh]">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-muted-foreground text-sm font-semibold tracking-wide">Retrieving system accounts...</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('users.name')}</th>
                  <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('users.email')}</th>
                  <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('users.role')}</th>
                  <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('common.joined')}</th>
                  <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">{t('users.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm">
                      <AlertCircle className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                      <p className="font-bold text-foreground text-base">{t('users.noUsers')}</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-muted/20 transition duration-150">
                      <td className="px-6 py-4 text-sm font-bold text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400 flex-shrink-0 font-black text-xs">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{formatTitle(user.name)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2.5 py-0.5 text-[9px] font-black tracking-wider rounded-lg uppercase border flex items-center gap-1.5 w-fit ${
                          user.role === 'admin' 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400' 
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                        }`}>
                          <Shield className="w-3 h-3 flex-shrink-0" />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 border border-border bg-card hover:bg-amber-500/10 hover:border-amber-500/20 hover:text-amber-500 dark:hover:text-amber-400 rounded-xl text-muted-foreground transition cursor-pointer"
                            title="Edit role/details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="p-2 border border-border bg-card hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-500 dark:hover:text-red-400 rounded-xl text-muted-foreground transition cursor-pointer"
                            title="Delete account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in-30 duration-150">
          <div className="bg-card rounded-2xl p-6 border border-border max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold font-heading text-foreground tracking-tight mb-5">
              {editingUser ? t('users.editUserTitle') : t('users.addUserTitle')}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t('users.fullName')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input outline-none text-sm font-medium"
                  required
                  placeholder="e.g. Verification Gerant"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t('users.email')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input outline-none text-sm font-medium"
                  required
                  placeholder="e.g. manager@company.com"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t('users.role')}
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input outline-none text-sm font-medium cursor-pointer"
                  required
                >
                  <option value="gerant" className="bg-card text-foreground">Gerant (Read-only Site Manager)</option>
                  <option value="admin" className="bg-card text-foreground">Admin (Full Control Operator)</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 border border-border hover:border-muted-foreground bg-muted text-muted-foreground hover:text-foreground rounded-xl transition font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-600 hover:to-orange-600 rounded-xl transition font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  {editingUser ? t('common.saveChanges') : t('users.addUser')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
