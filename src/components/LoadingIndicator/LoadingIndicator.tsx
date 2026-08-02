'use client';

import styles from './LoadingIndicator.module.css';

type LoadingVariant = 'spinner' | 'dots' | 'skeleton' | 'inline';

type LoadingIndicatorProps = {
  label?: string;
  variant?: LoadingVariant;
  /** Number of skeleton rows when variant="skeleton" */
  rows?: number;
  className?: string;
};

export default function LoadingIndicator({
  label = 'Loading…',
  variant = 'spinner',
  rows = 4,
  className = '',
}: LoadingIndicatorProps) {
  if (variant === 'skeleton') {
    return (
      <div className={`${styles.skeletonWrap} ${className}`} role="status" aria-live="polite" aria-label={label}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={styles.skeletonRow} style={{ animationDelay: `${i * 80}ms` }}>
            <span className={`${styles.bone} ${styles.boneSm}`} />
            <span className={`${styles.bone} ${styles.boneLg}`} />
            <span className={`${styles.bone} ${styles.boneMd}`} />
          </div>
        ))}
        <span className={styles.srOnly}>{label}</span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`${styles.inline} ${className}`} role="status" aria-live="polite">
        <span className={styles.spinnerSm} aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`${styles.center} ${className}`} role="status" aria-live="polite">
        <span className={styles.dots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <p className={styles.label}>{label}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.center} ${className}`} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <p className={styles.label}>{label}</p>
      <span className={styles.dots} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}
