import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { UserLevel } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredLevel?: UserLevel;
  minLevel?: UserLevel; // 최소 레벨 (이 레벨 이상)
}

export function ProtectedRoute({ children, requiredLevel, minLevel }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredLevel !== undefined && user.level !== requiredLevel) {
    return <Navigate to="/403" replace />;
  }

  if (minLevel !== undefined && user.level > minLevel) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}

