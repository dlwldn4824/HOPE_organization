import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBackendResource } from './useBackendResource';
import type { EventsApiData } from '../types/event';

export function useEventData() {
  const { isLoggedIn } = useAuth();
  const { data } = useBackendResource<EventsApiData>('/api/events', isLoggedIn);

  return useMemo(
    () => ({
      isLoggedIn,
      userInfo: data?.userInfo ?? null,
      events: data?.events ?? [],
      activeEvent: data?.activeEvent ?? null,
    }),
    [data, isLoggedIn],
  );
}
