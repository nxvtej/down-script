/** Converts a date string in dd/mm/yyyy format into a Date object. */
export default function parseParamDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(
    `${year}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`
  );
}
