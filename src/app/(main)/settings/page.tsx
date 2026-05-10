'use client';

import styles from '../main-pages.module.css';

export default function SettingsPage() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>Manage your account and preferences</p>
        </div>
      </div>

      <div style={{ maxWidth: '600px' }}>
        <div
          style={{
            background: 'white',
            border: '1px solid #e3e6ee',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '16px',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>
            Account Settings
          </h3>
          <p style={{ color: '#718096', fontSize: '14px' }}>
            Manage your account preferences and privacy settings here.
          </p>
        </div>

        <div
          style={{
            background: 'white',
            border: '1px solid #e3e6ee',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '16px',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>
            Notification Preferences
          </h3>
          <p style={{ color: '#718096', fontSize: '14px' }}>
            Control how and when you receive notifications.
          </p>
        </div>

        <div
          style={{
            background: 'white',
            border: '1px solid #e3e6ee',
            borderRadius: '8px',
            padding: '24px',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>
            Security
          </h3>
          <p style={{ color: '#718096', fontSize: '14px' }}>
            Manage your password and security settings.
          </p>
        </div>
      </div>
    </div>
  );
}
