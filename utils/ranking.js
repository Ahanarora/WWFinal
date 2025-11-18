// utils/ranking.js

// ---------- Generic date helpers ----------

function getMsFromAnyDate(value) {
  if (!value) return null;

  // Firestore Timestamp
  if (typeof value.toDate === "function") {
    return value.toDate().getTime();
  }

  // Firestore Timestamp-like object { seconds: number }
  if (typeof value.seconds === "number") {
    return value.seconds * 1000;
  }

  // JS Date
  if (value instanceof Date) {
    const t = value.getTime();
    return isNaN(t) ? null : t;
  }

  // ISO / string
  const d = new Date(value);
  const t = d.getTime();
  return isNaN(t) ? null : t;
}

// Last update time from CMS (what you were already using)
export function getUpdatedAtMs(item) {
  if (!item) return null;
  return getMsFromAnyDate(item.updatedAt || item.lastUpdatedAt || item.modifiedAt);
}

// First publish time (fallbacks to createdAt / updatedAt if missing)
export function getPublishedAtMs(item) {
  if (!item) return null;

  const primary =
    item.publishedAt ||
    item.firstPublishedAt ||
    item.firstLiveAt ||
    item.createdAt ||
    item.created_at;

  const t = getMsFromAnyDate(primary);
  if (t !== null) return t;

  // Fallback to updatedAt
  return getUpdatedAtMs(item);
}

// ---------- Metric 1: Freshness Score ----------
// freshness = exp( - hours_since_update / 48 )
// clamp to 0 after 7 days
function getFreshnessScore(item, nowMs) {
  const updatedAt = getUpdatedAtMs(item);
  if (!updatedAt) return 0;

  const hours = (nowMs - updatedAt) / (1000 * 60 * 60);
  if (hours <= 0) return 1;
  if (hours > 24 * 7) return 0; // older than a week

  const freshness = Math.exp(-hours / 48);
  return Math.max(0, Math.min(1, freshness));
}

// ---------- Metric 2: Coverage Momentum ----------
// momentum = log(1 + number_of_articles_in_last_72h)
// We'll look through item.timeline[*].coverage / sources / articles
// and count items that are recent.
function getCoverageMomentum(item, nowMs) {
  const timeline = Array.isArray(item?.timeline) ? item.timeline : [];
  const cutoffMs = nowMs - 72 * 60 * 60 * 1000; // last 72h
  let count = 0;

  for (const event of timeline) {
    if (!event) continue;

    // Try multiple possible coverage fields
    const coverageArrays = [
      event.coverage,
      event.coverageItems,
      event.sources,
      event.articles,
    ].filter(Array.isArray);

    for (const coverage of coverageArrays) {
      for (const art of coverage) {
        if (!art) continue;

        const articleDate =
          art.publishedAt || art.date || art.firstSeenAt || art.firstFoundAt;

        const articleMs = getMsFromAnyDate(articleDate);

        // If we have a date, enforce 72h window. If not, best effort: count it.
        if (articleMs) {
          if (articleMs >= cutoffMs && articleMs <= nowMs) {
            count += 1;
          }
        } else {
          count += 1;
        }
      }
    }
  }

  // momentum = log(1 + n)
  const momentum = Math.log(1 + count);
  return momentum; // this is unbounded but typically small; we'll just weight it.
}

// ---------- Metric 3: Story Velocity ----------
// velocity = events_last_14_days / total_events
function getStoryVelocity(item, nowMs) {
  const timeline = Array.isArray(item?.timeline) ? item.timeline : [];
  const total = timeline.length;
  if (!total) return 0;

  const cutoffMs = nowMs - 14 * 24 * 60 * 60 * 1000; // last 14 days
  let recentEvents = 0;

  for (const event of timeline) {
    if (!event) continue;

    const eventDate =
      event.date ||
      event.happenedAt ||
      event.eventDate ||
      event.createdAt ||
      event.timestamp;

    const eventMs = getMsFromAnyDate(eventDate);
    if (eventMs && eventMs >= cutoffMs && eventMs <= nowMs) {
      recentEvents += 1;
    }
  }

  const velocity = recentEvents / total;
  return Math.max(0, Math.min(1, velocity));
}

// ---------- Metric 4: Depth Score ----------
// depth = total_explainers / 20 (capped at 1)
function getDepthScore(item) {
  let explainerCount = 0;

  // Try different shapes that might exist in your schema
  if (Array.isArray(item?.analysisSections)) {
    explainerCount += item.analysisSections.length;
  }
  if (Array.isArray(item?.analysis)) {
    explainerCount += item.analysis.length;
  }
  if (Array.isArray(item?.explainers)) {
    explainerCount += item.explainers.length;
  }

  // If you have a precomputed field, prefer that:
  if (typeof item?.totalExplainers === "number") {
    explainerCount = item.totalExplainers;
  }

  const depth = explainerCount / 20;
  return Math.max(0, Math.min(1, depth));
}

// ---------- Pinned Boost ----------
function getPinnedBoost(item) {
  if (item?.isPinnedFeatured) {
    return 1.5; // override to sit at the very top
  }
  return 0;
}

// ---------- Main ranking function ----------

export function scoreContent(item = {}) {
  const nowMs = Date.now();

  // 5️⃣ Pinned override
  if (item.isPinnedFeatured) {
    return 1.5;
  }

  // 1️⃣ Freshness
  const freshness = getFreshnessScore(item, nowMs); // 0–1

  // 2️⃣ Coverage Momentum (log-scaled, but we'll just weight it)
  const momentum = getCoverageMomentum(item, nowMs); // ~0–4+

  // 3️⃣ Story Velocity (0–1)
  const velocity = getStoryVelocity(item, nowMs);

  // 4️⃣ Depth (0–1)
  const depth = getDepthScore(item);

  // 5️⃣ Random explore factor (0–0.1) for tie-breaking / freshness
  const randomExploreFactor = Math.random() * 0.1;

  // Weights (you can tweak)
  const w1 = 0.35; // freshness
  const w2 = 0.30; // momentum
  const w3 = 0.20; // velocity
  const w4 = 0.10; // depth
  const w5 = 0.05; // random explore

  const R =
    w1 * freshness +
    w2 * momentum +
    w3 * velocity +
    w4 * depth +
    w5 * randomExploreFactor;

  return R;
}
