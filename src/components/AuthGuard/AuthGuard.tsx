'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, getRefreshToken } from '@/lib/api-client';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    if (!accessToken && !refreshToken) {
      router.replace('/sign-in');
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Checking session...
      </div>
    );
  }

  return <>{children}</>;
}
