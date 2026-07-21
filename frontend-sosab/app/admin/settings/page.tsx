'use client';

import { Save, HardHat, ShieldAlert, Globe } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    companyName: 'SOSAB Construction',
    companyEmail: 'admin@company.com',
    targetAttendance: '95',
    workingDaysPerWeek: '6',
  });
  const [success, setSuccess] = useState(false);
  const { t } = useI18n();

  const handleChange = (field: string, value: string) => {
    setSettings({ ...settings, [field]: value });
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
        <h2 className="text-2xl font-semibold text-foreground tracking-tight">{t('settings.title')}</h2>
      </div>

      {/* Success Banner */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-lg p-4 text-emerald-500 font-medium text-sm max-w-2xl animate-in fade-in-50 duration-250">
          ✓ System configuration saved successfully.
        </div>
      )}

      {/* Settings Form */}
      <div className="glass-card rounded-xl border border-border shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Settings */}
          <div>
            <h3 className="text-base font-semibold text-foreground tracking-tight mb-5 flex items-center gap-2.5 border-b border-border pb-3">
              <HardHat className="w-5 h-5 text-amber-500" />
              Company Profile
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg glass-input outline-none text-sm font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  System Administration Email
                </label>
                <input
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => handleChange('companyEmail', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg glass-input outline-none text-sm font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* Attendance Settings */}
          <div>
            <h3 className="text-base font-semibold text-foreground tracking-tight mb-5 flex items-center gap-2.5 border-b border-border pb-3">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Attendance Benchmarks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Target Attendance Rate (%)
                </label>
                <input
                  type="number"
                  value={settings.targetAttendance}
                  onChange={(e) => handleChange('targetAttendance', e.target.value)}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2.5 rounded-lg glass-input outline-none text-sm font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Working Days Per Week
                </label>
                <select
                  value={settings.workingDaysPerWeek}
                  onChange={(e) => handleChange('workingDaysPerWeek', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg glass-input outline-none text-sm font-medium cursor-pointer"
                  required
                >
                  <option value="5" className="bg-[#0f131a]">5 Days (Mon - Fri)</option>
                  <option value="6" className="bg-[#0f131a]">6 Days (Mon - Sat)</option>
                  <option value="7" className="bg-[#0f131a]">7 Days (Full Week)</option>
                </select>
              </div>
            </div>
          </div>
          {/* Language Preference Section */}
          <div>
            <h3 className="text-base font-semibold text-foreground tracking-tight mb-5 flex items-center gap-2.5 border-b border-border pb-3">
              <Globe className="w-5 h-5 text-amber-500" />
              {t('settings.language')}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">{t('settings.language')}</span>
              <LanguageSwitcher />
            </div>
          </div>
          {/* Submit Button */}
          <div className="flex gap-4 border-t border-border pt-6">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/85 border border-border text-foreground font-medium px-4 py-2 rounded-lg transition duration-200 cursor-pointer text-xs"
            >
              <Save className="w-4 h-4" />
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
