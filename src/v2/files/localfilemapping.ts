import * as fs from "fs/promises";
import path from "path";

const localCommandIds: Map<string, number> = new Map<string, number>();
export default async function getCommandFromLocal(): Promise<
  Map<string, number>
> {
  const inputFolderPath = path.join(__dirname, "..", "..", "..", "input");

  try {
    await fs.readdir(inputFolderPath);
  } catch (err) {
    // console.log("/input not found");
    await fs.mkdir(inputFolderPath, { recursive: true });
    // console.log("created input folder");
    return new Map<string, number>();
  }

  const files = await fs.readdir(inputFolderPath);

  for (const file of files) {
    localCommandIds.set(file, 1);
  }
  return localCommandIds;
}
