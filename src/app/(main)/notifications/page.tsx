'use client';

import { useMemo, useState } from 'react';
import { Check, Trash2, Bell, ArrowLeft } from 'lucide-react';
import styles from '../main-pages.module.css';
import DataTable from '@/components/DataTable';
import ActionButton from '@/components/ActionButton';
import { ACTION_BUTTON_SIZES, ACTION_BUTTON_COLORS } from '@/constants/actionButtons';
import { useRouter } from 'next/navigation';
import {
  useNotificationsList,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from '@/services/notifications/useNotifications';
import type { Notification, NotificationFilters } from '@/types';

type FilterMode = 'ALL' | 'UNREAD' | 'READ';

interface NotificationTableRow {
  notificationId: string;
  userId: string;
  title: string;
  type: string;
  message: string;
  status: 'READ' | 'UNREAD';
  createdAt: string;
  updatedAt: string;
}

const STATUS_FILTERS: FilterMode[] = ['ALL', 'UNREAD', 'READ'];

function getNotificationId(notification: Notification) {
  return notification.notificationId || notification.notification_id || '';
}

function getUserId(notification: Notification) {
  return notification.userId || notification.user_id || '';
}

function getCreatedAt(notification: Notification) {
  return notification.createdAt || notification.created_at || '';
}

function getUpdatedAt(notification: Notification) {
  return notification.updatedAt || notification.updated_at || '';
}

function getStatus(notification: Notification): 'READ' | 'UNREAD' {
  if (notification.status) return notification.status;
  return notification.read ? 'READ' : 'UNREAD';
}

function toTableRow(notification: Notification): NotificationTableRow {
  const status = getStatus(notification);
  return {
    notificationId: getNotificationId(notification),
    userId: getUserId(notification),
    title: notification.title || notification.type,
    type: notification.type,
    message: notification.message,
    status,
    createdAt: getCreatedAt(notification),
    updatedAt: getUpdatedAt(notification),
  };
}

function formatDate(value: string) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterMode>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const queryFilters = useMemo<NotificationFilters>(
    () => ({
      page,
      limit,
      status: filter === 'ALL' ? undefined : filter,
    }),
    [filter, page, limit],
  );

  const { data: response, isLoading } = useNotificationsList(queryFilters);
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = response?.data?.data || [];
  const meta = response?.data?.meta;
  const rows = useMemo(() => notifications.map(toTableRow), [notifications]);

  const unreadCount = useMemo(
    () => rows.filter((notification) => notification.status === 'UNREAD').length,
    [rows],
  );

  const readCount = rows.length - unreadCount;
  const latestNotification = rows[0] || null;

  const typeCounts = useMemo(
    () =>
      rows.reduce<Record<string, number>>((accumulator, notification) => {
        accumulator[notification.type] = (accumulator[notification.type] || 0) + 1;
        return accumulator;
      }, {}),
    [rows],
  );

  const chartMax = Math.max(...Object.values(typeCounts), 1);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead.mutateAsync(notificationId);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!notificationId) return;
    if (window.confirm('Delete this notification?')) {
      try {
        await deleteNotification.mutateAsync(notificationId);
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const canGoPrevious = page > 1;
  const totalPages = meta?.totalPages || 1;
  const canGoNext = page < totalPages;

  const setFilterMode = (nextFilter: FilterMode) => {
    setFilter(nextFilter);
    setPage(1);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-4 text-sm hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-text-secondary)', border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={28} />
        </button>
        <div>
          <h1 className={styles.pageTitle}>Notifications</h1>
          <p className={styles.pageSubtitle}>
            Review alerts from across the platform and manage what stays unread.
          </p>
        </div>
        {unreadCount > 0 && (
          <ActionButton
            label="Mark All as Read"
            onClick={handleMarkAllAsRead}
            color={ACTION_BUTTON_COLORS.success}
            width={ACTION_BUTTON_SIZES.labelOnly.width}
            height={ACTION_BUTTON_SIZES.labelOnly.height}
            loading={markAllAsRead.isPending}
          />
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '14px', backgroundColor: 'var(--color-surface)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Unread</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{unreadCount}</div>
        </div>
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '14px', backgroundColor: 'var(--color-surface)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Read</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{readCount}</div>
        </div>
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '14px', backgroundColor: 'var(--color-surface)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Total on page</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{rows.length}</div>
        </div>
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '14px', backgroundColor: 'var(--color-surface)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Latest type</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{latestNotification?.type || '-'}</div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '18px',
        }}
      >
        <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', backgroundColor: 'var(--color-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Notification activity</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Read/unread split on the current page</div>
            </div>
            <Bell size={18} color="#3b82f6" />
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>
                <span>Unread</span>
                <span>{unreadCount}</span>
              </div>
              <div style={{ height: '10px', background: 'var(--color-surface-secondary)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${rows.length ? (unreadCount / rows.length) * 100 : 0}%`,
                    height: '100%',
                    background: '#ef4444',
                  }}
                />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>
                <span>Read</span>
                <span>{readCount}</span>
              </div>
              <div style={{ height: '10px', background: 'var(--color-surface-secondary)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${rows.length ? (readCount / rows.length) * 100 : 0}%`,
                    height: '100%',
                    background: '#22c55e',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>By notification type</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Current page snapshot from the backend list endpoint</div>
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {Object.entries(typeCounts).length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: '14px' }}>No notifications on this page</div>
            ) : (
              Object.entries(typeCounts).map(([type, count]) => {
                const width = chartMax ? Math.round((count / chartMax) * 100) : 0;
                return (
                  <div key={type} style={{ display: 'grid', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span>{type}</span>
                      <span style={{ color: '#6b7280' }}>{count}</span>
                    </div>
                    <div style={{ height: '10px', background: '#eef2f7', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${width}%`,
                          height: '100%',
                          background: '#3b82f6',
                          borderRadius: '999px',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {STATUS_FILTERS.map((status) => {
          const isActive = filter === status;
          return (
            <button
              key={status}
              onClick={() => setFilterMode(status)}
              style={{
                padding: '8px 16px',
                border: isActive ? '2px solid #3b82f6' : '1px solid #cbd5e0',
                borderRadius: '999px',
                background: isActive ? '#eff6ff' : 'white',
                color: isActive ? '#3b82f6' : '#4a5568',
                cursor: 'pointer',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {status}
            </button>
          );
        })}
      </div>

      <DataTable<NotificationTableRow>
        data={rows}
        columns={[
          {
            header: 'Status',
            accessor: (notification) => (notification.status === 'READ' ? '✓ Read' : '● Unread'),
            width: '12%',
          },
          { header: 'Type', accessor: 'type', width: '12%' },
          { header: 'Title', accessor: 'title', width: '18%' },
          { header: 'Message', accessor: 'message', width: '33%' },
          {
            header: 'Date',
            accessor: (notification) => formatDate(notification.createdAt),
            width: '15%',
          },
          {
            header: 'Actions',
            accessor: (notification) => (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {notification.status === 'UNREAD' && (
                  <ActionButton
                    onClick={() => handleMarkAsRead(notification.notificationId)}
                    icon={Check}
                    color={ACTION_BUTTON_COLORS.success}
                    tooltip="Mark as read"
                    width={ACTION_BUTTON_SIZES.iconOnly.width}
                    height={ACTION_BUTTON_SIZES.iconOnly.height}
                    loading={markAsRead.isPending}
                  />
                )}
                <ActionButton
                  onClick={() => handleDelete(notification.notificationId)}
                  icon={Trash2}
                  color={ACTION_BUTTON_COLORS.danger}
                  tooltip="Delete notification"
                  width={ACTION_BUTTON_SIZES.iconOnly.width}
                  height={ACTION_BUTTON_SIZES.iconOnly.height}
                  loading={deleteNotification.isPending}
                />
              </div>
            ),
            width: '10%',
          },
        ]}
        isLoading={isLoading}
        emptyMessage="No notifications"
        enablePagination={false}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
        <div style={{ color: '#6b7280', fontSize: '14px' }}>
          {meta
            ? `Page ${meta.page} of ${meta.totalPages} • ${meta.totalRecords} total records`
            : `Page ${page} of 1`}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ActionButton
            label="Previous"
            onClick={() => canGoPrevious && setPage((current) => Math.max(1, current - 1))}
            color={ACTION_BUTTON_COLORS.secondary}
            width={ACTION_BUTTON_SIZES.labelOnly.width}
            height={ACTION_BUTTON_SIZES.labelOnly.height}
            disabled={!canGoPrevious || isLoading}
          />
          <ActionButton
            label="Next"
            onClick={() => canGoNext && setPage((current) => Math.min(totalPages, current + 1))}
            color={ACTION_BUTTON_COLORS.secondary}
            width={ACTION_BUTTON_SIZES.labelOnly.width}
            height={ACTION_BUTTON_SIZES.labelOnly.height}
            disabled={!canGoNext || isLoading}
          />
        </div>
      </div>
    </div>
  );
}