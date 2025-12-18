import { formatDateDDMMYYYY } from "./formatTime";
import { normalizeTimelineBlocks } from "./normalizeTimelineBlocks";

export function getLatestHeadlines(timeline = [], limit = 2) {
  if (!Array.isArray(timeline) || timeline.length === 0) return [];

  const canonical = normalizeTimelineBlocks(timeline);

  const enriched = canonical
    .map((block, index) => {
      const timestamp = Date.parse(block.date);
      return {
        ...block,
        _timestamp: Number.isNaN(timestamp) ? index : timestamp,
        _index: index,
      };
    })
    .sort((a, b) => b._timestamp - a._timestamp)
    .slice(0, limit);

  return enriched.map((block, idx) => ({
    id: `${block.id || block.title || "headline"}-${idx}-${block._index}`,
    title: block.title || "Untitled update",
    dateLabel: formatDateDDMMYYYY(block.date),
  }));
}
