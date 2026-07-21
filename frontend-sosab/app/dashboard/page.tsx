'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Route based on role
    if (user.role === 'admin') {
      router.push('/admin');
    } else if (user.role === 'gerant') {
      router.push('/gerant');
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
        <div>
          <h3 className="font-bold text-lg font-heading text-foreground tracking-wide">Routing Secure Session...</h3>
          <p className="text-xs text-muted-foreground font-medium mt-1">Verifying credentials and access permissions</p>
        </div>
      </div>
    </div>
  );
}
