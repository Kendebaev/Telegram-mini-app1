// Dynamic API Base URL supporting custom VITE_API_URL or defaulting to relative /api
const envApiUrl = import.meta.env.VITE_API_URL;
const API_BASE = (envApiUrl && envApiUrl.trim() !== '')
  ? envApiUrl.trim().replace(/\/$/, '')
  : '/api';

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const initData = window.Telegram?.WebApp?.initData;
  if (initData) {
    headers['x-telegram-init-data'] = initData;
  }

  return headers;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMsg = `API request failed: ${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson?.error) {
        errorMsg = errJson.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}
