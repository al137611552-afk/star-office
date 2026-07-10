export async function fetchStatus() {
  const res = await fetch('/status');
  if (!res.ok) throw new Error(`status ${res.status}`);
  return await res.json();
}

export async function fetchActivityHistory(limit = 6) {
  const res = await fetch(`/activity-history?limit=${encodeURIComponent(limit)}`);
  if (!res.ok) throw new Error(`activity-history ${res.status}`);
  return await res.json();
}

export async function fetchYesterdayMemo(locale = 'zh') {
  const res = await fetch(`/yesterday-memo?lang=${encodeURIComponent(locale)}`);
  if (!res.ok) throw new Error(`memo ${res.status}`);
  return await res.json();
}

export async function setOfficeState(state, detail, detail_i18n = null) {
  const res = await fetch('/set_state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state, detail, detail_i18n }),
  });
  if (!res.ok) throw new Error(`set_state ${res.status}`);
  return await res.json();
}
