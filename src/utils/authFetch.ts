export const SESSION_EXPIRED_EVENT = 'hope:session-expired';

function fireSessionExpired() {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export function getAuthHeader() {
  const token = sessionStorage.getItem('hope_token');
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers: HeadersInit = {
    ...(init.headers ?? {}),
    ...(getAuthHeader() ?? {}),
  };
  const response = await fetch(input, { ...init, headers });
  if (response.status === 401) {
    fireSessionExpired();
  }
  return response;
}
