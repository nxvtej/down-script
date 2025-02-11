import download from "./fetch/download";
import fetchCommandIds from "./fetch/fetchCommandIds";
import getCommandFromLocal from "./files/localfilemapping";

const args = process.argv.slice(2);
let from = args[0];
let to = args[1];

export let flag: boolean = false;

if (args[2] !== undefined) {
  if (args[2].toLowerCase() === "true") flag = true;
}

if (!from || !to) {
  console.error("Error: Please provide both start and end command.");
  process.exit(1);
}

console.log("Start :", from);
console.log("End :", to);
console.log("Flag:", flag);
/**
 * first  step:- get input/data dates in hashmap for re-extraction purpos
 * second step:- get all files from that erpInstance and only store those that lies in our range
 * third  step:- get the latest files via filter for createdAt
 * fourth step:- download based on newly filteredmap
 * fifth  step:- if fails start brute force using closer month and date +1 , -1
 */
export let localFilesMap: Map<string, number> = new Map<string, number>();
export let erpFilesMap: string[][] = [];
export let filesToRemove: string[] = [];
export let downloadableFiles: Map<string, string[]> = new Map<
  string,
  string[]
>();
export let ignoredFiles: string[];

async function main() {
  console.log("from: ", from, " to: ", to);
  localFilesMap = await getCommandFromLocal();
  console.log("localfiles mapping is:-", localFilesMap);

  erpFilesMap = await fetchCommandIds(from, to, localFilesMap);
  console.log(
    `filtered values for commandId ${from} :to: ${to} example`,
    erpFilesMap
  );

  console.log("downloading files mapping of size ", erpFilesMap.length);
  const failedArray = await download(erpFilesMap);
  console.log("failed files are", failedArray.length);
  for (const file of failedArray) console.log(file);
}
main();

/**
 * problem is im not using start format for dates and time conversions
 * keep them consistent
 */
