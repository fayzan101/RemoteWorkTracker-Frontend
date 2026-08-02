'use client';
import MainShell from '@/components/main-shell';
import AuthGuard from '@/components/AuthGuard/AuthGuard';
import { AuthProvider } from '@/context/AuthContext';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        <MainShell>{children}</MainShell>
      </AuthGuard>
    </AuthProvider>
  );
}
