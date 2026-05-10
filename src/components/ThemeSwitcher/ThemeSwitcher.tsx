'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import styles from './ThemeSwitcher.module.css';

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <label className={styles.toggleSwitch}>
      <input 
        type="checkbox" 
        checked={theme === 'dark'}
        onChange={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      />
      <div className={styles.toggleSwitchBackground}>
        <div className={styles.toggleSwitchHandle}></div>
      </div>
    </label>
  );
}
