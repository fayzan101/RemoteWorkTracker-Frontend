'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  size?: 'small' | 'medium' | 'large';
  /** Shows a soft overlay spinner over the modal body */
  loading?: boolean;
  loadingLabel?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions,
  size = 'medium',
  loading = false,
  loadingLabel = 'Loading…',
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={() => {
        if (!loading) onClose();
      }}
      role="presentation"
    >
      <div
        className={`${styles.modal} ${styles[size]}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-busy={loading || undefined}
      >
        <div className={styles.header}>
          <h2 id="modal-title" className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
            disabled={loading}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className={styles.content}>
          {loading && (
            <div className={styles.loadingOverlay} role="status" aria-live="polite">
              <div className={styles.loadingCard}>
                <span className={styles.spinner} aria-hidden="true" />
                <span className={styles.loadingText}>{loadingLabel}</span>
                <span className={styles.dots} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            </div>
          )}
          {children}
        </div>

        {actions ? <div className={styles.footer}>{actions}</div> : null}
      </div>
    </div>,
    document.body
  );
}
