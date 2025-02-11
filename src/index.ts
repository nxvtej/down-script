import getDatesFromInput from "./utils/datesFromFilesName";
import fetchFromErp from "./utils/getAllFilesErp";
import download from "./utils/download";
import filterLatestEntries from "./filter/checkwithLocal";

const args = process.argv.slice(2);
let from = args[0];
let to = args[1];

export let flag: boolean = false;

if (args[2] !== undefined) {
  if (args[2].toLowerCase() === "true") flag = true;
}

const currentYear = "2025"; // Default year

function ensureYear(date: string): string {
  const parts = date.split("/");
  if (parts.length === 2) {
    // If only day and month are provided, add the default year
    return `${parts[0]}/${parts[1]}/${currentYear}`;
  }
  return date; // If year is present, return as is
}

if (!from || !to) {
  console.error("Error: Please provide both start and end dates.");
  process.exit(1);
}

// Ensure the year is included
from = ensureYear(from);
to = ensureYear(to);

console.log("Start Date:", from);
console.log("End Date:", to);
console.log("Flag:", flag);
/**
 * first  step:- get input/data dates in hashmap for re-extraction purpos
 * second step:- get all files from that erpInstance and only store those that lies in our range
 * third  step:- get the latest files via filter for createdAt
 * fourth step:- download based on newly filteredmap
 * fifth  step:- if fails start brute force using closer month and date +1 , -1
 */
export let localFilesMap: Map<string, string[]> = new Map<string, string[]>();
export let erpFilesMap: Map<string, string[]> = new Map<string, string[]>();
export let filesToRemove: string[] = [];
export let downloadableFiles: Map<string, string[]> = new Map<
  string,
  string[]
>();
export let ignoredFiles: string[];

async function main() {
  console.log("from: ", from, " to: ", to);
  localFilesMap = await getDatesFromInput();
  console.log("localfiles mapping is:-", localFilesMap);

  erpFilesMap = await fetchFromErp(from, to, localFilesMap);
  console.log(`filtered values for date ${from}:to:${to} example`);
  for (const [key, values] of erpFilesMap) {
    console.log(
      "exmaple key ",
      key,
      " wiht values ",
      values,
      " totalt length for this is ",
      erpFilesMap.size
    );
    break;
  }

  // now try downloading these files via commandId
  const result = await filterLatestEntries(erpFilesMap, localFilesMap);
  console.log("result", result);
  downloadableFiles = result.downloadableFiles;
  await download(downloadableFiles);
}
main();

/**
 * problem is im not using start format for dates and time conversions
 * keep them consistent
 */
