
// utils/normalizeTimelineBlocks.js
import { normalizeSources } from "./normalizeSources";

// significance must be 1 | 2 | 3
function coerceSignificance(val) {
  if (val === 2 || val === "2") return 2;
  if (val === 3 || val === "3") return 3;
  return 1;
}

// date can come as string, number, or Firestore Timestamp-like
function coerceDate(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return new Date(val).toISOString();

  // Firestore Timestamp
  if (val && typeof val.toDate === "function") {
    try {
      return val.toDate().toISOString();
    } catch {
      return "";
    }
  }

  // Timestamp-like { seconds }
  if (val && typeof val.seconds === "number") {
    return new Date(val.seconds * 1000).toISOString();
  }

  return "";
}

// Back-compat: old stories may not have type; old events may use event/title, timestamp/startedAt, etc.
export function normalizeTimelineBlocks(raw) {
  if (!Array.isArray(raw)) return [];

  return raw.map((block) => {
    if (!block || typeof block !== "object") {
      return {
        type: "event",
        title: "",
        description: "",
        date: "",
        significance: 1,
        sources: [],
        media: null,
        contexts: [],
        faqs: [],
      };
    }

    const type = block.type === "image" ? "image" : "event";

    // IMAGE BLOCK passthrough (keep future-proof fields)
    if (type === "image") {
      const url = block.url || block.imageUrl || "";
      if (!url) return null;

      return {
        id: block.id,
        type: "image",
        url,
        caption: typeof block.caption === "string" ? block.caption : undefined,
        aspectRatio:
          typeof block.aspectRatio === "number" && block.aspectRatio > 0
            ? block.aspectRatio
            : undefined,
      };
    }

    // EVENT BLOCK canonicalization
    const title = block.title ?? block.event ?? "";
    const description = block.description ?? "";
    const date = coerceDate(block.date ?? block.timestamp ?? block.startedAt ?? "");
    const significance = coerceSignificance(block.significance);

    const sources = normalizeSources(block.sources);
    const media =
      block.media && typeof block.media === "object"
        ? {
            ...block.media,
            // keep old displayMode if it exists
            type: block.media.type ?? block.displayMode ?? null,
            sourceIndex:
              typeof block.media.sourceIndex === "number"
                ? block.media.sourceIndex
                : 0,
          }
        : block.displayMode
        ? { type: block.displayMode, sourceIndex: 0 }
        : null;

    return {
      ...block,
      type: "event",
      title,
      description,
      date,
      significance,
      sources,
      media,
      contexts: Array.isArray(block.contexts) ? block.contexts : [],
      faqs: Array.isArray(block.faqs) ? block.faqs : [],
      factStatus:
        block.factStatus === "debated" ||
        block.factStatus === "partially_debated" ||
        block.factStatus === "consensus"
          ? block.factStatus
          : undefined,
      factNote: typeof block.factNote === "string" ? block.factNote : undefined,
      factUpdatedAt:
        typeof block.factUpdatedAt === "number" || typeof block.factUpdatedAt === "string"
          ? block.factUpdatedAt
          : undefined,
    };
  }).filter(Boolean);
}
