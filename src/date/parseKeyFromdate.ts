/** Extracts the "from" date from a key and converts it into a Date object. */
export default function parseKeyFromDate(key: string): Date | null {
  const regex = /^from_(\d{2})-(\d{2})-(\d{4})_to_(\d{2})-(\d{2})-(\d{4})/;
  const match = key.match(regex);
  if (match) {
    const [_, day, month, year] = match;
    const date = new Date(`${year}-${month}-${day}`);

    if (isNaN(date.getTime())) {
      console.error(`Invalid date parsed from key: ${key}`);
      return null;
    }

    return date;
  }
  return null;
}
