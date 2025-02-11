/** Converts an ISO date string (e.g., "2024-11-01T00:00:00.000Z") into dd-mm-yyyy format. */
export function formatDateToKeyFormat(isoDate: string): string {
  const dateObj = new Date(isoDate);
  const day = String(dateObj.getUTCDate()).padStart(2, "0");
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const year = dateObj.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

/** Generates a key from two ISO date strings in format: "from_dd-mm-yyyy_to_dd-mm-yyyy" */
export function generateKey(fromIso: string, toIso: string): string {
  const fromFormatted = formatDateToKeyFormat(fromIso);
  const toFormatted = formatDateToKeyFormat(toIso);
  return `from_${fromFormatted}_to_${toFormatted}`;
}
