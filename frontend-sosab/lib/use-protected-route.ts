'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type UserRole } from './auth-context';

export function useProtectedRoute(allowedRoles?: UserRole[]) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      // User doesn't have permission
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router]);

  return { user, isLoading, isAuthenticated };
}
