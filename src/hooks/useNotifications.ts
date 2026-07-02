import { useCallback } from 'react';
import { notifyDataUpdated, useBackendResource } from './useBackendResource';
import type { NotificationListResponse } from '../types/notification';
import { authFetch } from '../utils/authFetch';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export function useNotifications(enabled: boolean) {
  const { data, error } = useBackendResource<NotificationListResponse>(
    '/api/notifications',
    enabled,
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    const response = await authFetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
    if (!response.ok) {
      throw new Error('알림을 읽음 처리하지 못했습니다.');
    }
    notifyDataUpdated();
  }, []);

  const markAllAsRead = useCallback(async () => {
    const response = await authFetch(`${API_BASE_URL}/api/notifications/read-all`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('알림을 모두 읽음 처리하지 못했습니다.');
    }
    notifyDataUpdated();
  }, []);

  return {
    items: data?.items ?? [],
    unreadCount: data?.unreadCount ?? 0,
    error,
    markAsRead,
    markAllAsRead,
  };
}
