// src/utils/dateFormatter.ts

/**
 * Formats a date string or Date object to a consistent date and time string across the app.
 * Example output: MM/DD/YYYY, HH:MM:SS AM/PM
 *
 * @param date - The date string or Date object to format
 * @param options - Optional Intl.DateTimeFormat options to override defaults
 * @returns Formatted date string or empty string if invalid
 */
export function formatDateTime(
  date: string | Date | undefined | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };
  // Merge user options with defaults
  const mergedOptions = { ...defaultOptions, ...options };
  // Remove comma for consistency
  return d.toLocaleString(undefined, mergedOptions).replace(",", "");
}
