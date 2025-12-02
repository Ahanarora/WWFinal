//utils/formatTime.js
export function formatUpdatedAt(updatedAt) {
  if (!updatedAt) return "";

  let date;

  // Firestore Timestamp
  if (typeof updatedAt.toDate === "function") {
    date = updatedAt.toDate();
  } else {
    date = new Date(updatedAt);
  }

  if (!date || isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  // < 1 hour
  if (diffHours < 1) {
    const mins = Math.floor(diffHours * 60);
    return mins <= 1 ? "Updated just now" : `Updated ${mins}m ago`;
  }

  // < 24 hours
  if (diffHours < 24) {
    return `Updated ${Math.floor(diffHours)}h ago`;
  }

  // < 7 days
  if (diffDays < 7) {
    return `Updated ${Math.floor(diffDays)}d ago`;
  }

  // Fallback: absolute date (Jan 14)
  return `Updated ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}

export function formatDateDDMMYYYY(dateInput) {
  if (!dateInput) return "";

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return dateInput;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

const ORDINALS = ["th", "st", "nd", "rd"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getOrdinal = (day) => {
  const v = day % 100;
  const suffix = ORDINALS[(v - 20) % 10] || ORDINALS[v] || ORDINALS[0];
  return `${day}${suffix}`;
};

export function formatDateLongOrdinal(dateInput) {
  if (!dateInput) return "";

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return dateInput;

  const dayNum = date.getDate();
  const monthName = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();

  return `${getOrdinal(dayNum)} ${monthName} ${year}`;
}
