export function timeAgo(timestamp) {
  if (!timestamp) return "Unknown";

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "Updated just now";
  if (diff < 3600) return `Updated ${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `Updated ${Math.floor(diff / 3600)} hours ago`;
  if (diff < 172800) return "Updated yesterday";
  return `Updated ${Math.floor(diff / 86400)} days ago`;
}
