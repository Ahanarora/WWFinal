//utils/getLatestHeadlines.js

import { formatDateDDMMYYYY } from "./formatTime";

export function getLatestHeadlines(timeline = [], limit = 2) {
  if (!Array.isArray(timeline) || timeline.length === 0) return [];

  const enriched = timeline
    .map((event = {}, index) => {
      const timestamp = Date.parse(event.date);
      return {
        ...event,
        _timestamp: isNaN(timestamp) ? index : timestamp,
        _index: index,
      };
    })
    .sort((a, b) => b._timestamp - a._timestamp)
    .slice(0, limit);

  return enriched.map((event, idx) => ({
    id: `${event.event || "headline"}-${idx}-${event._index}`,
    title: event.event || "Untitled update",
    dateLabel: formatDateDDMMYYYY(event.date),
  }));
}
