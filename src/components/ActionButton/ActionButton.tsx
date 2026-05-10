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
};

export default function ActionButton({
  onClick,
  color = '#3b82f6',
  icon: IconComponent,
  imageUrl,
  label,
  width = 32,
  height = 32,
  tooltip,
  disabled = false,
  loading = false,
}: ActionButtonProps) {
  // Determine width/height values with units
  const getSize = (val: number | string | undefined) => {
    if (val === undefined) return '32px';
    if (typeof val === 'number') return `${val}px`;
    return val;
  };

  const widthValue = getSize(width);
  const heightValue = getSize(height);

  const buttonStyle = {
    '--button-color': color,
    '--button-width': widthValue,
    '--button-height': heightValue,
  } as React.CSSProperties & { [key: string]: string };

  return (
    <button
      className={styles.actionButton}
      onClick={onClick}
      disabled={disabled || loading}
      title={tooltip}
      style={buttonStyle}
    >
      {loading ? (
        <div className={styles.spinner} />
      ) : (
        <>
          {IconComponent && <IconComponent size={16} className={styles.icon} />}
          {imageUrl && <img src={imageUrl} alt={label} className={styles.image} />}
          {label && <span className={styles.label}>{label}</span>}
        </>
      )}
    </button>
  );
}
