import { useCallback } from 'react';
import { notifyDataUpdated, useBackendResource } from './useBackendResource';
import type { NotificationListResponse } from '../types/notification';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function authHeaders() {
  const token = sessionStorage.getItem('hope_token');
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export function useNotifications(enabled: boolean) {
  const { data, error } = useBackendResource<NotificationListResponse>(
    '/api/notifications',
    enabled,
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error('알림을 읽음 처리하지 못했습니다.');
    }

    notifyDataUpdated();
  }, []);

  const markAllAsRead = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
      method: 'POST',
      headers: authHeaders(),
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
