// ----------------------------------------
// utils/ranking.js — New Velocity + 4-Hour-Window Ranking
// ----------------------------------------

/**
 * Convert Firestore timestamp to ms.
 * Prefer createdAt → fallback updatedAt.
 */
function getMs(t) {
  if (!t) return null;

  if (typeof t.toDate === "function") return t.toDate().getTime();
  if (t.seconds) return t.seconds * 1000;

  const d = new Date(t);
  return isNaN(d) ? null : d.getTime();
}

/**
 * Count how many timeline events were added
 * within the last X hours.
 *
 * Velocity = "recent story changes".
 */
function getVelocityScore(item, hours = 48) {
  const events = Array.isArray(item.timeline) ? item.timeline : [];
  const cutoff = Date.now() - hours * 60 * 60 * 1000;

  // count events whose creation/update time is recent
  const recent = events.filter((ev) => {
    const ts = ev.updatedAt || ev.createdAt;
    if (!ts) return false;
    const ms = getMs(ts);
    return ms && ms >= cutoff;
  }).length;

  // Normalize: 0 → 1
  // 5 new events in 48 hours = full score
  const score = Math.min(recent / 5, 1);

  return score;
}

/**
 * Recency Score:
 * Split timeline into 4-hour freshness windows.
 * 0–4 hours old → 1.0
 * 4–8 hours old → 0.9
 * ...
 * > 48 hours old → 0
 */
function getRecencyScore(item) {
  const ts =
    getMs(item.createdAt) ||
    getMs(item.updatedAt);

  if (!ts) return 0;

  const diffHours = (Date.now() - ts) / (1000 * 60 * 60);

  // 4-hour windows decay
  const windowIndex = Math.floor(diffHours / 4);

  // Example:
  // window 0 → 1.0
  // window 1 → 0.9
  // window 2 → 0.8, etc.
  const score = Math.max(1 - windowIndex * 0.1, 0);

  return score;
}

/**
 * Final ranking:
 * 60% Velocity (FAST stories)
 * 40% Recency (NEW stories)
 */
export function scoreContent(item = {}) {
  const recency = getRecencyScore(item);      // 0 → 1
  const velocity = getVelocityScore(item);    // 0 → 1

  return (
    recency * 0.40 +
    velocity * 0.60
  );
}
