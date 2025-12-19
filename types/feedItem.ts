import type { TimelineBlock, SourceItem } from "@ww/shared";

export type FactCheck = {
  confidenceScore: number;
  notes?: string;
};

export type FeedItem = {
  id: string;
  title: string;
  description?: string;

  updatedAt?: string;
  primaryCategory?: string;
  tags?: string[];

  timeline?: TimelineBlock[];
  sources?: SourceItem[];

  factCheck?: FactCheck;
  faqs?: { q: string; a: string }[];
  contexts?: string[];

  _originalIndex?: number; // UI-only
};
