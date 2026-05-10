'use client';

import React from 'react';
import Link from 'next/link';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function Navbar() {
  return (
    <nav
      className="w-full flex items-center justify-between p-4 transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <Link href="/">
        <span className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
          My Next App
        </span>
      </Link>
      <div className="flex items-center gap-4">
        {/* Add navigation links here */}
        <ThemeSwitcher />
      </div>
    </nav>
  );
}
