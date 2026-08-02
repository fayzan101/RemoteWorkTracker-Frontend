import React from 'react';
import type { LucideIcon } from 'lucide-react';
import styles from './ActionButton.module.css';

type ActionButtonProps = {
  onClick: () => void;
  color?: string;
  icon?: LucideIcon;
  imageUrl?: string;
  label?: string;
  width?: number | string;
  height?: number | string;
  tooltip?: string;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
};

export default function ActionButton({
  onClick,
  color = '#0f766e',
  icon: IconComponent,
  imageUrl,
  label,
  width = 32,
  height = 32,
  tooltip,
  disabled = false,
  loading = false,
  type = 'button',
}: ActionButtonProps) {
  const getSize = (val: number | string | undefined) => {
    if (val === undefined) return '32px';
    if (typeof val === 'number') return `${val}px`;
    return val;
  };

  const widthValue = getSize(width);
  const heightValue = getSize(height);
  const isAutoWidth = widthValue === 'auto' || width === 'auto';

  const buttonStyle = {
    '--button-color': color,
    '--button-width': isAutoWidth ? 'auto' : widthValue,
    '--button-height': heightValue,
  } as React.CSSProperties & { [key: string]: string };

  return (
    <button
      type={type}
      className={`${styles.actionButton} ${isAutoWidth ? styles.autoWidth : ''} ${label ? styles.withLabel : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
      title={tooltip}
      style={buttonStyle}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          {label ? <span className={styles.label}>{label}</span> : null}
        </>
      ) : (
        <>
          {IconComponent && <IconComponent size={16} className={styles.icon} />}
          {imageUrl && <img src={imageUrl} alt="" className={styles.image} />}
          {label && <span className={styles.label}>{label}</span>}
        </>
      )}
    </button>
  );
}
