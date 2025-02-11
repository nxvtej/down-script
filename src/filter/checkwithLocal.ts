/*
import fs, { copyFileSync } from "fs";
import path from "path";
import { flag } from "../index";
export default async function filterLatestEntries(
  erpMap: Map<string, string[]>,
  localMap: Map<string, string[]>
): Promise<{ downloadableFiles: Map<string, string[]> }> {
  const downloadableFiles = new Map<string, string[]>();
  const filesToRemove: string[] = [];

  erpMap.forEach((erpValue, key) => {
    const erpCreatedAt = getTimestamp(erpValue[1], erpValue[2]);
    const commandId = erpValue[0];
    if (localMap.has(key)) {
      const localValue = localMap.get(key)!;
      const localCreatedAt = getTimestamp(localValue[0], localValue[1]);

      if (erpCreatedAt > localCreatedAt) {
        // If ERP entry is newer, mark local file for removal
        // console.log("makring ofr removal", key, localValue);
        const oldFileName = generateFileName(key, localValue[0], localValue[1]);
        console.log("older file name: - ", oldFileName);
        // console.log(oldFileName);
        filesToRemove.push(oldFileName);

        downloadableFiles.set(key, erpValue);
        // console.log(`Updated ${key}: ERP version is newer`);
      } //else {
      //   // downloadableFiles.set(key, localValue);
      //   // downloadableFiles.get(key)?.unshift(commandId);
      //   // console.log(`Kept ${key}: Local version is newer or same`);
      // }
    } else {
      downloadableFiles.set(key, erpValue);
      // console.log(`Added ${key}: New entry from ERP`);
    }
  });

  // Check for files in local that are not in ERP (extra removeer files)
  flag &&
    localMap.forEach((localValue, key) => {
      if (!erpMap.has(key)) {
        const obsoleteFileName = generateFileName(
          key,
          localValue[0],
          localValue[1]
        );
        filesToRemove.push(obsoleteFileName);
        // console.log(`Obsolete file marked for deletion: ${obsoleteFileName}`);
      }
    });
  console.log("files to reomve", filesToRemove);
  await removefiles(filesToRemove);
  return { downloadableFiles };
}

function getTimestamp(date: string, time: string): number {
  const formattedTime = time.replace(/_/g, ":");
  return new Date(`${date}T${formattedTime}Z`).getTime();
}

function generateFileName(key: string, date: string, time: string): string {
  // Assuming the file naming convention is something like:
  // "from_12-08-2024_to_13-08-2024_2024-08-27_10_26_36.665.json"
  return `${key}_createdAt_${date}_T_${time}.zip`;
}

async function removefiles(filesToRemove: string[]) {
  console.log("\nFiles to be removed:");
  filesToRemove.forEach((file) => console.log(file));

  for (const file of filesToRemove) {
    // from_13-08-2024_to_20-08-2024_createdAt_2024-08-28_T_06_25_49.427
    // C:\Users\navdeep.s\Desktop\projects\retool-download\input\from_13-08-2024_to_20-08-2024_createdAt_2024-08-28_T_06_25_49.427.json
    let filePath = path.join(__dirname, "..", "..", "/input", file);
    // filePath.slice(0, -4);
    // filePath += ".zip";
    console.log(filePath);
    try {
      await fs.promises.unlink(filePath);
      console.log(`Successfully removed: ${filePath}`);
    } catch (error) {
      console.error(`Error removing file ${filePath}:`, error);
    }
  }
}
*/
import fs, { copyFileSync } from "fs";
import path from "path";
import { flag } from "../index";

export default async function filterLatestEntries(
  erpMap: Map<string, string[]>,
  localMap: Map<string, string[]>
): Promise<{ downloadableFiles: Map<string, string[]> }> {
  const downloadableFiles = new Map<string, string[]>();
  const filesToRemove: string[] = [];

  // First, process all ERP entries
  for (const [key, erpValue] of erpMap.entries()) {
    const erpCreatedAt = getTimestamp(erpValue[1], erpValue[2]);
    const commandId = erpValue[0];

    if (localMap.has(key)) {
      const localValue = localMap.get(key)!;
      const localCreatedAt = getTimestamp(localValue[0], localValue[1]);

      if (erpCreatedAt > localCreatedAt) {
        // If ERP entry is newer
        const oldFileName = generateFileName(key, localValue[0], localValue[1]);
        console.log("older file name: - ", oldFileName);
        filesToRemove.push(oldFileName);
        // Make sure to create a new array to avoid reference issues
        downloadableFiles.set(key, [...erpValue]);
      }
    } else {
      // New entry from ERP
      // Make sure to create a new array to avoid reference issues
      downloadableFiles.set(key, [...erpValue]);
    }
  }

  // Handle files to remove if flag is true
  if (flag) {
    for (const [key, localValue] of localMap.entries()) {
      if (!erpMap.has(key)) {
        const obsoleteFileName = generateFileName(
          key,
          localValue[0],
          localValue[1]
        );
        filesToRemove.push(obsoleteFileName);
      }
    }
  }

  console.log("Files to remove:", filesToRemove);
  console.log("Downloadable files map:", downloadableFiles);

  await removefiles(filesToRemove);

  // Return the map of files to download
  return { downloadableFiles };
}

// Rest of your helper functions remain the same
function getTimestamp(date: string, time: string): number {
  const formattedTime = time.replace(/_/g, ":");
  return new Date(`${date}T${formattedTime}Z`).getTime();
}

function generateFileName(key: string, date: string, time: string): string {
  return `${key}_createdAt_${date}_T_${time}.zip`;
}

async function removefiles(filesToRemove: string[]) {
  console.log("\nFiles to be removed:");
  filesToRemove.forEach((file) => console.log(file));

  for (const file of filesToRemove) {
    let filePath = path.join(__dirname, "..", "..", "/input", file);
    try {
      await fs.promises.unlink(filePath);
      console.log(`Successfully removed: ${filePath}`);
    } catch (error) {
      console.error(`Error removing file ${filePath}:`, error);
    }
  }
}
