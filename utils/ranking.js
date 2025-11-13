// utils/ranking.js

function getUpdatedAtMs(item) {
  const u = item?.updatedAt;
  if (!u) return null;

  if (typeof u.toDate === "function") return u.toDate().getTime();
  if (typeof u.seconds === "number") return u.seconds * 1000;

  const d = new Date(u);
  return isNaN(d) ? null : d.getTime();
}

export function scoreContent(item = {}) {
  const now = Date.now();

  // 1. Recency
  const updatedAt = getUpdatedAtMs(item);
  let recencyScore = 0.2;
  if (updatedAt) {
    const hours = (now - updatedAt) / (1000 * 60 * 60);
    recencyScore = Math.max(0, 1 - hours / 72);
  }

  // 2. Significance
  const events = Array.isArray(item.timeline) ? item.timeline : [];
  let significanceScore = 0;
  if (events.length > 0) {
    const sum = events.reduce(
      (a, e) => a + (typeof e.significance === "number" ? e.significance : 1),
      0
    );
    significanceScore = (sum / events.length) / 3;
  }

  // 3. Activity
  let activityScore = 0;
  if (events.length > 0) {
    const times = events
      .map((e) => new Date(e.date).getTime())
      .filter((t) => !isNaN(t));
    if (times.length > 0) {
      const latest = Math.max(...times);
      const days = (now - latest) / (1000 * 60 * 60 * 24);
      activityScore = Math.max(0, 1 - days / 5);
    }
  }

  // 4. Depth
  const contexts =
    (item.contexts?.length || 0) +
    events.reduce((a, e) => a + (e.contexts?.length || 0), 0);

  const depthScore = Math.min(1, contexts / 20);

  // 5. Engagement (placeholder)
  const engagementScore = 0.5;

  return (
    recencyScore * 0.35 +
    significanceScore * 0.25 +
    activityScore * 0.2 +
    depthScore * 0.1 +
    engagementScore * 0.1
  );
}
