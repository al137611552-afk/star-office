const apiMeta = document.querySelector('meta[name="star-office-api-base"]');
const apiOverride = new URLSearchParams(window.location.search).get('api');
const configuredBase = apiOverride === 'same-origin'
  ? ''
  : (apiOverride || apiMeta?.content || '');

export const API_BASE = configuredBase.replace(/\/$/, '');

export function isRemoteObserver() {
  return Boolean(API_BASE);
}

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

async function fetchJson(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(apiUrl(path), {
      cache: 'no-store',
      ...options,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`${path} ${res.status}`);
    return await res.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`${path} timed out`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchStatus() {
  return await fetchJson('/status');
}

export async function fetchActivityHistory(limit = 6) {
  return await fetchJson(`/activity-history?limit=${encodeURIComponent(limit)}`);
}

export async function fetchYesterdayMemo(locale = 'zh') {
  return await fetchJson(`/yesterday-memo?lang=${encodeURIComponent(locale)}`);
}

export async function setOfficeState(state, detail, detail_i18n = null) {
  if (isRemoteObserver()) {
    throw new Error('Remote observer API is read-only');
  }
  return await fetchJson('/set_state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state, detail, detail_i18n }),
  });
}
