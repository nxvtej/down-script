import path from "path";
import { resourcePoll } from "./fetchCommandIds";
import fs from "fs";
async function writeToFile(response: Response, commandId: string) {
  // now request passed so, sace the files using key and value of createdAt date
  const jsonRespone = await response.json();

  // console.log("somethign from gjsonSrespn", jsonRespone);
  if (jsonRespone && jsonRespone.queryData && jsonRespone.queryData.Body) {
    const base64Data = jsonRespone.queryData.Body;
    const bufferData = Buffer.from(base64Data, "base64");

    // crate /input oif not present tyhen create
    const inputDir = path.join(__dirname, "..", "..", "..", "input");
    if (!fs.existsSync(inputDir)) {
      await fs.promises.mkdir(inputDir, { recursive: true });
    }
    // const trimedCreatedAt = createdAt.replace(/:/g, "_");
    const outputFilePath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "input",
      `${commandId}.zip`
    );

    await fs.promises.writeFile(outputFilePath, bufferData);
  }
}

export default async function download(
  downloadFiles: string[][]
): Promise<string[]> {
  const failedArray: string[] = [];
  let workingResource: string | null = null;

  for (const data of downloadFiles) {
    // Changed from failedArray to downloadFiles
    let response;
    let success = false;

    // If we have a working resource from previous successful request, try it first
    if (workingResource) {
      response = await makeRequest(data[1], workingResource);
      if (response.status === 200) {
        success = true;
      }
      await writeToFile(response, data[0]);
    }

    // If no working resource or previous request failed, try all resources
    if (!success) {
      for (const resource of resourcePoll) {
        response = await makeRequest(data[1], resource);
        if (response.status === 200) {
          workingResource = resource; // Save the working resource
          success = true;
          await writeToFile(response, data[0]);
          break;
        }
      }
    }

    // If all attempts failed, add to failedArray
    if (!success) {
      failedArray.push(data[0]);
    }
  }

  return failedArray;
}

// Helper function to make the fetch request
async function makeRequest(
  fileKey: string,
  resource: string
): Promise<Response> {
  return fetch(
    `https://retool.internal.cleartax.co/api/pages/uuids/${process.env.ClearTaxId}/query?queryName=download_staging_zip_file`,
    {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        timestamp: "1738998721585",
        "x-retool-client-version": "2.113.22-9dddc16 (Build 1874)",
        "x-xsrf-token": `${process.env.xXsrfToken}`,
        cookie: `${process.env.ACCESS_TOKEN}`,
      },
      body: `{"userParams":{"bucketNameParams":{"length":0},"fileKeyParams":{"0":"${fileKey}","length":1},"delimiterParams":{"length":0},"maxKeysParams":{"length":0},"prefixParams":{"length":0},"signedOperationNameParams":{"length":0},"signedOperationOptionsParams":{"length":0},"uploadFileNameParams":{"length":0},"uploadFileTypeParams":{"length":0},"copySourceParams":{"length":0},"tagSetParams":{"length":0}},"queryType":"S3Query","environment":"production","showLatest":false,"isEditorMode":false,"frontendVersion":"1","releaseVersion":null,"includeQueryExecutionMetadata":true,"resourceName":"${resource}"}`,
      method: "POST",
    }
  );
}
