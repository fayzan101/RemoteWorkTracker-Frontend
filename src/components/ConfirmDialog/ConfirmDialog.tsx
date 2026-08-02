'use client';

import Modal from '../Modal';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="small"
      actions={
        <>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnCancel}`}
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${isDangerous ? styles.btnDanger : styles.btnConfirm}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className={styles.btnLoading}>
                <span className={styles.spinner} aria-hidden="true" />
                Processing…
              </span>
            ) : (
              confirmText
            )}
          </button>
        </>
      }
    >
      <p className={styles.message}>{message}</p>
    </Modal>
  );
}
