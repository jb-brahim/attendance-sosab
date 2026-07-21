'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/language-switcher';
import { AlertCircle, Shield, HardHat, ChevronDown, Lock, Mail, ChevronUp } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background text-foreground antialiased overflow-hidden">
      {/* Left Column: Premium Brand & Industrial Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:col-span-7 relative flex-col justify-between p-12 overflow-hidden border-r border-border">
        {/* Abstract Architectural Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
        
        {/* Soft Gold Aura */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,transparent_70%)] blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_70%)] blur-[60px]" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[linear-gradient(135deg,rgba(245,158,11,0.2),rgba(245,158,11,0.05))] border border-amber-500/25 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <HardHat className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-wider text-foreground">SOSAB</span>
            <span className="text-xs block text-amber-500/80 tracking-widest font-semibold uppercase">TRACKER</span>
          </div>
        </div>

        {/* Feature Pitch */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <h1 className="text-5xl font-black tracking-tight leading-[1.1] text-foreground">
            {t('login.tagline1')} <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              {t('login.tagline2')}
            </span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed font-medium">
            {t('login.description')}
          </p>
          
          {/* Quick Metrics Badges */}
          <div className="flex gap-4 pt-4">
            <div className="glass-card py-3 px-5 rounded-xl flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-foreground">{t('login.liveSync')}</span>
            </div>
            <div className="glass-card py-3 px-5 rounded-xl flex items-center gap-3">
              <Shield className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-foreground">{t('login.secureRbac')}</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex justify-between items-center text-xs text-muted-foreground font-medium">
          <p>{t('login.copyright')}</p>
          <p className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            V2.4 Enterprise
          </p>
        </div>
      </div>

      {/* Right Column: Premium Auth Card Form */}
      <div className="lg:col-span-5 flex items-center justify-center p-6 sm:p-12 relative bg-[radial-gradient(circle_at_center,rgba(22,26,38,0.3)_0%,transparent_100%)]">
        
        {/* Floating Background Glow */}
        <div className="absolute w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Mobile Brand Header */}
          <div className="text-center lg:hidden space-y-3">
            <HardHat className="w-12 h-12 text-amber-500 mx-auto bg-amber-500/10 p-2.5 rounded-2xl border border-amber-500/20" />
            <h2 className="text-3xl font-black tracking-wide text-foreground uppercase">
              SOSAB <span className="text-amber-500">TRACKER</span>
            </h2>
            <p className="text-muted-foreground text-sm font-medium">Attendance Management Platform</p>
          </div>

          {/* Language Switcher bar on Login */}
          <div className="flex justify-end">
            <LanguageSwitcher />
          </div>

          {/* Core Login Card */}
          <div className="glass-card rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-foreground tracking-tight">{t('login.title')}</h2>
              <p className="text-muted-foreground text-sm font-medium">{t('login.subtitle')}</p>
            </div>

            {error && (
              <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-300">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('login.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl glass-input outline-none text-sm font-medium"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl glass-input outline-none text-sm font-medium"
                    required
                  />
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative group overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 hover:text-slate-900 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 font-bold py-3.5 px-4 rounded-xl transition duration-300 transform active:scale-[0.98] shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 cursor-pointer text-sm"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('login.submitting')}
                  </div>
                ) : (
                  t('login.submit')
                )}
              </button>
            </form>

            {/* Premium Accordion Credentials Drawer */}
            <div className="pt-4 border-t border-border">
              <button
                onClick={() => setShowCredentials(!showCredentials)}
                className="w-full flex items-center justify-between text-xs font-semibold text-amber-600 hover:text-amber-500 dark:text-amber-500/85 dark:hover:text-amber-400 py-2 px-3 rounded-lg hover:bg-muted transition cursor-pointer"
              >
                <span>{t('login.demoAccounts')}</span>
                {showCredentials ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <div className={`overflow-hidden transition-all duration-300 ${
                showCredentials ? 'max-h-32 mt-3 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="bg-muted/50 border border-border rounded-xl p-3.5 space-y-2.5 text-xs text-muted-foreground font-medium leading-relaxed">
                  <div className="flex justify-between items-center border-b border-border pb-1.5">
                    <span className="text-foreground font-bold">Admin Console:</span>
                    <span className="text-amber-600 dark:text-amber-500/90 font-mono font-bold">admin@company.com / AdminSecurePassword123!</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground font-bold">Manager App:</span>
                    <span className="text-amber-600 dark:text-amber-500/90 font-mono font-bold">verify.gerant@company.com / GerantVerifyPassword123!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
