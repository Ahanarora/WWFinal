// utils/normalizeSources.js

const DEFAULT_PROVIDER = "manual";

export function normalizeSourceItem(s) {
  const src = s && typeof s === "object" ? s : {};

  return {
    title: typeof src.title === "string" ? src.title : "",
    link: typeof src.link === "string" ? src.link : "",
    sourceName: typeof src.sourceName === "string" ? src.sourceName : (typeof src.siteName === "string" ? src.siteName : ""),
    imageUrl: src.imageUrl ?? null,
    pubDate: src.pubDate ?? null,
    provider: typeof src.provider === "string" ? src.provider : DEFAULT_PROVIDER,
  };
}

export function normalizeSources(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeSourceItem).filter((s) => !!s.link);
}
