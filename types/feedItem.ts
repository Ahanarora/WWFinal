import type { TimelineBlock, SourceItem } from "@ww/shared";

export type FeedItem = {
  id: string;
  title: string;
  description?: string;

  updatedAt?: string;
  primaryCategory?: string;
  tags?: string[];

  timeline?: TimelineBlock[];
  sources?: SourceItem[];

  faqs?: { q: string; a: string }[];
  contexts?: string[];

  _originalIndex?: number; // UI-only
};
