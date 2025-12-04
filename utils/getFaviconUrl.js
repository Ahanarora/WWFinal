export function getFaviconUrl(link) {
  if (!link) return null;

  let domain = null;
  try {
    domain = new URL(link).hostname;
  } catch {
    return null;
  }

  // Primary: FaviconKit
  return `https://api.faviconkit.com/${domain}/64`;
}

export function getFallbackFavicon(link) {
  try {
    const origin = new URL(link).origin;
    return `${origin}/favicon.ico`;
  } catch {
    return null;
  }
}

export function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase() || "?";
}
