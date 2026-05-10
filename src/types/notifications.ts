export interface Notification {
  notification_id?: string;
  notificationId?: string;
  user_id?: string;
  userId?: string;
  type: string;
  message: string;
  read?: boolean;
  status?: 'READ' | 'UNREAD';
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  title?: string;
}

export interface NotificationListMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface NotificationListResponse {
  meta: NotificationListMeta;
  data: Notification[];
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  status?: 'READ' | 'UNREAD';
}

export interface MarkNotificationAsReadPayload {
  read: boolean;
}
