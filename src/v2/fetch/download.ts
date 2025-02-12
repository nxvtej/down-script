import path from "path";
import { resourcePoll } from "./fetchCommandIds";
import fs from "fs";
import { flag } from "..";
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
  const sandurl = `https://retool.internal.cleartax.co/api/pages/uuids/4f6547d2-c0c6-11ee-b230-ab48450c39f7/query?queryName=download_staging_zip_file`;
  const produrl = `https://retool.internal.cleartax.co/api/pages/uuids/4f6547d2-c0c6-11ee-b230-ab48450c39f7/query?queryName=download_prod_zip_file`;
  let url = "";
  if (flag) {
    url = produrl;
  } else {
    url = sandurl;
  }

  for (const data of downloadFiles) {
    // Changed from failedArray to downloadFiles
    let response;
    let success = false;

    // If we have a working resource from previous successful request, try it first
    if (workingResource) {
      response = await makeRequest(data[1], workingResource, url);
      if (response.status === 200) {
        success = true;
      }
      await writeToFile(response, data[0]);
    }

    // If no working resource or previous request failed, try all resources
    if (!success) {
      for (const resource of resourcePoll) {
        response = await makeRequest(data[1], resource, url);
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
      console.log(data[0], data[1]);
      failedArray.push(data[0]);
    }
  }

  return failedArray;
}

// Helper function to make the fetch request
async function makeRequest(
  fileKey: string,
  resource: string,
  url: string
): Promise<Response> {
  let response;

  response = await fetch(url, {
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
  });
  return response;
}

fetch(
  "https://retool.internal.cleartax.co/api/pages/uuids/4f6547d2-c0c6-11ee-b230-ab48450c39f7/query?queryName=download_prod_zip_file",
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
      timestamp: "1739343172828",
      "x-retool-client-version": "2.113.22-9dddc16 (Build 1874)",
      "x-xsrf-token": "efd9e842-54db-4ecd-948e-a75d8526f888",
      cookie:
        "accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ4c3JmVG9rZW4iOiJlZmQ5ZTg0Mi01NGRiLTRlY2QtOTQ4ZS1hNzVkODUyNmY4ODgiLCJ2ZXJzaW9uIjoiMS4yIiwiaWF0IjoxNzM3NTIyMTg3fQ.1OeiPed69ScWUiMYXlNI2MvOP8TZuiwuI4mD7lRbkqY; xsrfToken=efd9e842-54db-4ecd-948e-a75d8526f888; xsrfTokenSameSite=efd9e842-54db-4ecd-948e-a75d8526f888; __gsas=ID=9388a80a1718e577:T=1737668532:RT=1737668532:S=ALNI_MZDN-kg2qsIHoJYlEkhqcx_uuI8lA; in_retool_canary_group=never",
      Referer: "https://retool.internal.cleartax.co/",
      "Referrer-Policy": "origin",
    },
    body: '{"userParams":{"bucketNameParams":{"length":0},"fileKeyParams":{"0":"6e1f6e28-8b22-4aae-be8f-dcfbb07e59d5/c722a677-d37d-4d70-aceb-1da60ee71dee/2025/FEBRUARY/11/67A945CE007ED305ED648D45/data_extraction/6e1f6e28-8b22-4aae-be8f-dcfbb07e59d5/20250211001142.6703880.zip","length":1},"delimiterParams":{"length":0},"maxKeysParams":{"length":0},"prefixParams":{"length":0},"signedOperationNameParams":{"length":0},"signedOperationOptionsParams":{"length":0},"uploadFileNameParams":{"length":0},"uploadFileTypeParams":{"length":0},"copySourceParams":{"length":0},"tagSetParams":{"length":0}},"queryType":"S3Query","environment":"production","showLatest":false,"isEditorMode":false,"frontendVersion":"1","releaseVersion":null,"includeQueryExecutionMetadata":true,"resourceName":"0f990bf4-43d5-4b81-a503-7ad28a024abf"}',
    method: "POST",
  }
);
