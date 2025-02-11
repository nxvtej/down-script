// console.log("retuning values", returnvalue);
/**
   * retuning values Map(7) {
  'from_12-08-2024_to_28-08-2024' => [ '66cefb5ef461612bec3b8ea2', '2024-08-28T10:26:38.118Z' ],
  'from_12-08-2024_to_20-08-2024' => [ '66c6d9a4b282886f6763fdd7', '2024-08-22T06:24:36.961Z' ]
}

Map(7) {
  'from_12-08-2024_to_13-08-2024' => [ '2024-08-27', '10_26_36.665' ]
   */

import parseKeyFromDate from "../date/parseKeyFromdate";
import parseParamDate from "../date/parseParamDate";

/** Filters keys within the given date range. */
export default function filterKeysInDateRange(
  filesMap: Map<string, string[]>,
  localFilesMap: Map<string, string[]>,
  startParam: string,
  endParam: string
): Map<string, string[]> {
  const filteredMap = new Map<string, string[]>();
  const startDate = parseParamDate(startParam);
  const endDate = parseParamDate(endParam);

  //   console.log(
  //     `Filtering from ${startDate.toISOString()} to ${endDate.toISOString()}`
  //   );

  filesMap.forEach((value, key) => {
    const keyDate = parseKeyFromDate(key);

    // console.log(`Checking key: ${key}, Extracted date: ${keyDate}`);

    if (!keyDate) {
      // console.warn(`Skipping key: ${key} (Invalid Date)`);
      return;
    }

    if (
      keyDate.getTime() >= startDate.getTime() &&
      keyDate.getTime() <= endDate.getTime()
    ) {
      //   console.log(keyDate.getTime());
      if (localFilesMap.has(key)) {
        const testi = localFilesMap.get(key);
        if (testi && (testi.length ?? 0) > 1 && testi[1] !== undefined) {
        }
        // console.log("file present in lcoal ", key);
      }
      filteredMap.set(key, value);
    }
  });

  //   console.log("Filtered Map:", [...filteredMap.entries()]);
  return filteredMap;
}
// *******************************************************************************************
