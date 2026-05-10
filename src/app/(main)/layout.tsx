'use client';
import MainShell from '@/components/main-shell';
import { AuthProvider } from '@/context/AuthContext';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><MainShell>{children}</MainShell></AuthProvider>;
}