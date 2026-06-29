export type NotificationType = 'reward' | 'study' | 'attendance' | 'report';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  path: string;
  createdAt: string;
  read: boolean;
}

export interface NotificationListResponse {
  items: AppNotification[];
  unreadCount: number;
}
