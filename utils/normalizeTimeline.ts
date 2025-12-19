import type {
  TimelineBlock,
  TimelineEventBlock,
  TimelineImageBlock,
} from "@ww/shared";

export function normalizeTimeline(
  raw: any[] | undefined
): TimelineBlock[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((item, index) => {
    // Backward compatibility
    const type =
      item.type === "image" || item.type === "event"
        ? item.type
        : "event";

    if (type === "image") {
      const block: TimelineImageBlock = {
        id: item.id ?? `img-${index}`,
        type: "image",
        imageUrl: item.imageUrl ?? item.url ?? null,
        caption: item.caption ?? "",
      };
      return block;
    }

    const block: TimelineEventBlock = {
      id: item.id ?? `evt-${index}`,
      type: "event",
      title: item.title ?? item.event ?? "",
      description: item.description ?? "",
      date: item.date ?? null,
      sources: item.sources ?? [],
      significance:
        typeof item.significance === "number"
          ? item.significance
          : undefined,
    };

    return block;
  });
}
