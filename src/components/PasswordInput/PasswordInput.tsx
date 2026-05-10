'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './PasswordInput.module.css';

type PasswordInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  className?: string;
  'aria-invalid'?: boolean;
};

export default function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
  className,
  'aria-invalid': ariaInvalid,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`${styles.wrap} ${className ?? ''}`.trim()}>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className={styles.input}
        aria-invalid={ariaInvalid}
      />
      <button
        type="button"
        className={styles.toggle}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        <Image src="/icons/password.svg" alt="" width={20} height={20} className={styles.toggleIcon} />
      </button>
    </div>
  );
}
