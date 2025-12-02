//utils/ranking.js

function safeMs(t) {
  if (!t) return null;

  if (typeof t.toDate === "function") return t.toDate().getTime();
  if (t.seconds) return t.seconds * 1000;

  const d = new Date(t);
  return isNaN(d) ? null : d.getTime();
}

function getRecencyScore(item) {
  const created = safeMs(item.createdAt);
  const updated = safeMs(item.updatedAt);

  const ts = created || updated;
  if (!ts) return 0;

  const diff = Date.now() - ts;
  if (!diff || isNaN(diff)) return 0;

  const hours = diff / (1000 * 60 * 60);
  if (isNaN(hours)) return 0;

  const windowIndex = Math.floor(hours / 4);
  if (isNaN(windowIndex)) return 0;

  return Math.max(1 - windowIndex * 0.1, 0);
}

function getVelocityScore(item) {
  const events = Array.isArray(item.timeline) ? item.timeline : [];

  const cutoff = Date.now() - 48 * 60 * 60 * 1000;

  let recent = 0;
  for (const ev of events) {
    const ts = safeMs(ev.updatedAt || ev.createdAt);
    if (ts && ts >= cutoff) recent++;
  }

  return Math.min(recent / 5, 1);
}

export function scoreContent(item = {}) {
  const recency = getRecencyScore(item);
  const velocity = getVelocityScore(item);

  return recency * 0.4 + velocity * 0.6;
}
