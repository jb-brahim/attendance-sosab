'use client';

import { Save, User, Shield } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function GerantSettingsPage() {
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || 'Verification Gerant',
    email: user?.email || 'verify.gerant@company.com',
    currentPassword: '',
    newPassword: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 p-1">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground tracking-tight">Portal Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your user profile, credentials, and console preferences</p>
      </div>

      {/* Success Banner */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-lg p-4 text-emerald-500 font-medium text-sm max-w-2xl animate-in fade-in-50 duration-250">
          ✓ Profile settings updated successfully.
        </div>
      )}

      {/* Settings Form */}
      <div className="glass-card rounded-xl border border-border shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Section */}
          <div>
            <h3 className="text-base font-semibold text-foreground tracking-tight mb-5 flex items-center gap-2.5 border-b border-border pb-3">
              <User className="w-5 h-5 text-amber-500" />
              User Profile
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg glass-input outline-none text-sm font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg glass-input outline-none text-sm font-medium opacity-60 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Assigned Portal Role
                </label>
                <input
                  type="text"
                  value="Operations Manager (Gerant)"
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg glass-input outline-none text-sm font-medium opacity-60 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div>
            <h3 className="text-base font-semibold text-foreground tracking-tight mb-5 flex items-center gap-2.5 border-b border-border pb-3">
              <Shield className="w-5 h-5 text-amber-500" />
              Change Portal Password
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => handleChange('currentPassword', e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-lg glass-input outline-none text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => handleChange('newPassword', e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-lg glass-input outline-none text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 border-t border-border pt-6">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/85 border border-border text-foreground font-medium px-4 py-2 rounded-lg transition duration-200 cursor-pointer text-xs"
            >
              <Save className="w-4 h-4" />
              Update Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
