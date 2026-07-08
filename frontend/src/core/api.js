export async function fetchStatus() {
  const res = await fetch('/status');
  if (!res.ok) throw new Error(`status ${res.status}`);
  return await res.json();
}

export async function fetchYesterdayMemo() {
  const res = await fetch('/yesterday-memo');
  if (!res.ok) throw new Error(`memo ${res.status}`);
  return await res.json();
}

export async function setOfficeState(state, detail) {
  const res = await fetch('/set_state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state, detail }),
  });
  if (!res.ok) throw new Error(`set_state ${res.status}`);
  return await res.json();
}
