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
