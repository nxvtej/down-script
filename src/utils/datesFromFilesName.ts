import * as fs from "fs/promises";
import path from "path";

function formatToDDMMYYYY(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

// local files format from_12-08-2024_to_19-08-2024_createdAt_2024-08-28T06_18_09.020Z.zip
// now i need to compare thse with erpfiles , if they are already latest remove from the erpMapping
// else replace their cretaedAt date and the update command id it will be downloaded,

// issue is who wouldi know that its latest, the erp respones is already sorted.
// so the first extraction would always be latest

export default async function getDatesFromInput(): Promise<
  Map<string, string[]>
> {
  const filesMap = new Map<string, string[]>();
  const inputFolderPath = path.join(__dirname, "..", "..", "..", "input");

  //   checking for /input directory
  try {
    await fs.readdir(inputFolderPath);
  } catch (err) {
    // console.log("/input not found");
    await fs.mkdir(inputFolderPath, { recursive: true });
    // console.log("created input folder");
    return new Map<string, string[]>();
  }

  // read files and store in map
  const filePattern =
    /^from_(\d{2}-\d{2}-\d{4})_to_(\d{2}-\d{2}-\d{4})_createdAt_(\d{4}-\d{2}-\d{2})_T_(\d{2}_\d{2}_\d{2}\.\d{3}).zip$/; // from_12-08-2024_to_28-08-2024_createdAt_2024-08-28 T 10_26_38.118Z.zip
  const files = await fs.readdir(inputFolderPath);

  let ignoreCount: number = 0;
  for (const file of files) {
    const match = file.match(filePattern);
    if (match) {
      const [, from, to, createdAt, timestamp] = match;
      const key = `from_${from}_to_${to}`;
      filesMap.set(key, [createdAt, timestamp]);
    } else {
      ignoreCount++;
      // console.log(file);
    }
  }
  if (ignoreCount != 0) {
    // later for tracking dates via files
    // console.log(`${ignoreCount}`);
  }
  return filesMap;
}
