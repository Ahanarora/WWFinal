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
      const url = item.url ?? item.imageUrl ?? "";
      const block: TimelineImageBlock = {
        id: item.id ?? `img-${index}`,
        type: "image",
        url,
        caption: item.caption ?? "",
      };
      return block;
    }

    const factStatus =
      item.factStatus === "debated" ||
      item.factStatus === "partially_debated" ||
      item.factStatus === "consensus"
        ? item.factStatus
        : undefined;

    const block: TimelineEventBlock & {
      factStatus?: "consensus" | "debated" | "partially_debated";
      factNote?: string;
      factUpdatedAt?: any;
    } = {
      id: item.id ?? `evt-${index}`,
      type: "event",
      title: item.title ?? item.event ?? "",
      description: item.description ?? "",
      date: item.date ?? undefined,
      sources: item.sources ?? [],
      significance:
        typeof item.significance === "number"
          ? item.significance
          : undefined,
      factStatus,
      factNote: item.factNote ?? undefined,
      factUpdatedAt: item.factUpdatedAt ?? undefined,
    };

    return block;
  });
}
