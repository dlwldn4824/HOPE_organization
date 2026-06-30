import { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';

export const DATA_UPDATED_EVENT = 'hope:data-updated';

export function notifyDataUpdated() {
  window.dispatchEvent(new Event(DATA_UPDATED_EVENT));
}

export function useBackendResource<T>(path: string, enabled: boolean) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const load = async () => {
      try {
        const response = await authFetch(path);
        const payload = (await response.json()) as T;

        if (!response.ok) {
          throw new Error('데이터를 불러오지 못했습니다.');
        }

        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : '데이터를 불러오지 못했습니다.');
        }
      }
    };

    void load();
    window.addEventListener(DATA_UPDATED_EVENT, load);

    return () => {
      cancelled = true;
      window.removeEventListener(DATA_UPDATED_EVENT, load);
    };
  }, [enabled, path]);

  return {
    data: enabled ? data : null,
    error: enabled ? error : null,
  };
}
