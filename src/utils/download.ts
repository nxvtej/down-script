import path from "path";
import fs from "fs";
import { fail } from "assert";
import { configDotenv } from "dotenv";
import { resourcePoll } from "./getAllFilesErp";
configDotenv();
const whichMonth = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "MAY",
  "APRIL",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

/**
 * Formats date to "DD MONTH YYYY" (e.g., "18 JULY 2024")
 * @param isoDate - ISO formatted date string (e.g., "2024-07-18T11:05:07.142Z")
 * @returns Formatted date string
 */
function formatDate(isoDate: string): {
  day: string;
  month: string;
  year: number;
} {
  const dateObj = new Date(isoDate);
  const day = String(dateObj.getUTCDate()).padStart(2, "0"); // Get day with leading zero
  const month = whichMonth[dateObj.getUTCMonth()]; // Get month name
  const year = dateObj.getUTCFullYear(); // Get full year
  return { day, month, year };
}

export default async function download(
  filteredFiles: Map<string, string[]>
): Promise<boolean> {
  const failedArray: any[] = [];
  for (const [key, value] of filteredFiles.entries()) {
    const createdAt = value[1]; // Extract createdAt timestamp
    const createdAtTime = value[2];
    const { day, month, year } = formatDate(createdAt); // Convert to "DD MONTH YYYY"
    const commandId = value[0]; // Extract commandId
    const url: string = value[3];

    // console.log(
    //   `Downloading file for date: $[${day}, ${month}, ${year}], Command ID: ${commandId}`
    // );

    // Call fetchFromRetool function (assuming it's defined elsewhere)
    const response: any = await fetchFromRetool(
      day,
      month,
      year,
      commandId,
      key,
      value,
      0,
      url
    );

    if (response.status != 200) {
      failedArray.push([day, month, year, commandId]);
      console.error(`Failed to fetch data for: ${commandId}`);
    } else {
      console.log("response 200 for", commandId);
      // now request passed so, sace the files using key and value of createdAt date
      const jsonRespone = await response.json();

      // console.log("somethign from gjsonSrespn", jsonRespone);
      if (jsonRespone && jsonRespone.queryData && jsonRespone.queryData.Body) {
        const base64Data = jsonRespone.queryData.Body;
        const bufferData = Buffer.from(base64Data, "base64");
        if (!bufferData || bufferData.length === 0) {
          console.error("Invalid buffer data");
          failedArray.push([day, month, year, commandId]);
          return false;
        }

        // crate /input oif not present tyhen create
        const inputDir = path.join(__dirname, "..", "..", "input");
        if (!fs.existsSync(inputDir)) {
          await fs.promises.mkdir(inputDir, { recursive: true });
        }
        const trimedCreatedAt = createdAt.replace(/:/g, "_");
        const outputFilePath = path.join(
          __dirname,
          "..",
          "..",
          "input",
          `${key}_createdAt_${trimedCreatedAt}_T_${createdAtTime}.zip`
        );

        await fs.promises.writeFile(outputFilePath, bufferData);
      } else {
        console.error(
          "Unexpected response structure or missing Body in queryData`"
        );
        failedArray.push(commandId);
      }
    }
  }
  console.log(failedArray);
  return true;
}
async function fetchFromRetool(
  date: string,
  month: string,
  yearN: number,
  commandId: string,
  key: string,
  value: string[],
  attempt: number = 0,
  url: string
): Promise<any> {
  // Maximum attempts to try different dates
  const MAX_ATTEMPTS = 6;
  if (attempt >= MAX_ATTEMPTS) return 400;

  // Convert date to number for calculations
  const currentDate = new Date(yearN, parseInt(month) - 1, parseInt(date));

  // Calculate offset based on attempt number (0, +1, -1, +2, -2)
  let offset = 0;
  switch (attempt) {
    case 0:
      offset = 0;
      break; // current date
    case 1:
      commandId = commandId.toUpperCase();
    case 2:
      offset = 1;
      break; // +1 day
    case 3:
      offset = -1;
      break; // -1 day
    case 4:
      offset = 2;
      break; // +2 days
    case 5:
      offset = -2;
      break; // -2 days
  }

  const newDate = new Date(currentDate);
  newDate.setDate(currentDate.getDate() + offset);

  // // Format the new date components
  // const tryDate = newDate.getDate().toString().padStart(2, "0");
  // const tryMonth = (newDate.getMonth() + 1).toString().padStart(2, "0");
  // const tryYear = newDate.getFullYear();

  // Make the API request
  let response;
  for (const resource of resourcePoll) {
    response = await fetch(
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
        body: `{"userParams":{"bucketNameParams":{"length":0},"fileKeyParams":{"0":"${url}","length":1},"delimiterParams":{"length":0},"maxKeysParams":{"length":0},"prefixParams":{"length":0},"signedOperationNameParams":{"length":0},"signedOperationOptionsParams":{"length":0},"uploadFileNameParams":{"length":0},"uploadFileTypeParams":{"length":0},"copySourceParams":{"length":0},"tagSetParams":{"length":0}},"queryType":"S3Query","environment":"production","showLatest":false,"isEditorMode":false,"frontendVersion":"1","releaseVersion":null,"includeQueryExecutionMetadata":true,"resourceName":"${resource}"}`,
        method: "POST",
      }
    );

    if (response.status === 200) return response;
  }

  // If no successful response, try with next attempt
  return fetchFromRetool(
    date,
    month,
    yearN,
    commandId,
    key,
    value,
    attempt + 1,
    url
  );
}
/*
fetch(
  "https://retool.internal.cleartax.co/api/pages/uuids/4f6547d2-c0c6-11ee-b230-ab48450c39f7/query?queryName=download_staging_zip_file",
  {
    headers: {
    
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
      timestamp: "1739206344077",
      "x-retool-client-version": "2.113.22-9dddc16 (Build 1874)",
      "x-xsrf-token": "efd9e842-54db-4ecd-948e-a75d8526f888",
      cookie:
        "accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ4c3JmVG9rZW4iOiJlZmQ5ZTg0Mi01NGRiLTRlY2QtOTQ4ZS1hNzVkODUyNmY4ODgiLCJ2ZXJzaW9uIjoiMS4yIiwiaWF0IjoxNzM3NTIyMTg3fQ.1OeiPed69ScWUiMYXlNI2MvOP8TZuiwuI4mD7lRbkqY; xsrfToken=efd9e842-54db-4ecd-948e-a75d8526f888; xsrfTokenSameSite=efd9e842-54db-4ecd-948e-a75d8526f888; __gsas=ID=9388a80a1718e577:T=1737668532:RT=1737668532:S=ALNI_MZDN-kg2qsIHoJYlEkhqcx_uuI8lA; in_retool_canary_group=never",
      Referer: "https://retool.internal.cleartax.co/",
      "Referrer-Policy": "origin",
    },
    body: '{"userParams":{"bucketNameParams":{"length":0},"fileKeyParams":{"0":"acf4c4fe-940e-41d2-899e-253ae34bb30c/f8579cdc-4f00-4f73-ac17-e4714cbc325c/2024/NOVEMBER/27/674710C53C5432160B1F6DC0/data_extraction/acf4c4fe-940e-41d2-899e-253ae34bb30c/20241127125623.0689700.zip","length":1},"delimiterParams":{"length":0},"maxKeysParams":{"length":0},"prefixParams":{"length":0},"signedOperationNameParams":{"length":0},"signedOperationOptionsParams":{"length":0},"uploadFileNameParams":{"length":0},"uploadFileTypeParams":{"length":0},"copySourceParams":{"length":0},"tagSetParams":{"length":0}},"queryType":"S3Query","environment":"production","showLatest":false,"isEditorMode":false,"frontendVersion":"1","releaseVersion":null,"includeQueryExecutionMetadata":true,"resourceName":"779072eb-70da-480a-b275-dc5dd9e17500"}',
    method: "POST",
  }
);
*/

fetch(
  "https://retool.internal.cleartax.co/api/pages/uuids/4f6547d2-c0c6-11ee-b230-ab48450c39f7/query?queryName=download_staging_zip_file",
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
      timestamp: "1739244855685",
      "x-retool-client-version": "2.113.22-9dddc16 (Build 1874)",
      "x-xsrf-token": "efd9e842-54db-4ecd-948e-a75d8526f888",
      cookie:
        "accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ4c3JmVG9rZW4iOiJlZmQ5ZTg0Mi01NGRiLTRlY2QtOTQ4ZS1hNzVkODUyNmY4ODgiLCJ2ZXJzaW9uIjoiMS4yIiwiaWF0IjoxNzM3NTIyMTg3fQ.1OeiPed69ScWUiMYXlNI2MvOP8TZuiwuI4mD7lRbkqY; xsrfToken=efd9e842-54db-4ecd-948e-a75d8526f888; xsrfTokenSameSite=efd9e842-54db-4ecd-948e-a75d8526f888; __gsas=ID=9388a80a1718e577:T=1737668532:RT=1737668532:S=ALNI_MZDN-kg2qsIHoJYlEkhqcx_uuI8lA; in_retool_canary_group=never",
      Referer: "https://retool.internal.cleartax.co/",
      "Referrer-Policy": "origin",
    },
    body: '{"userParams":{"bucketNameParams":{"length":0},"fileKeyParams":{"0":"acf4c4fe-940e-41d2-899e-253ae34bb30c/f8579cdc-4f00-4f73-ac17-e4714cbc325c/2024/NOVEMBER/11/673277BDC2A3544223C64B10/data_extraction/acf4c4fe-940e-41d2-899e-253ae34bb30c/20241111213416.4711390.zip","length":1},"delimiterParams":{"length":0},"maxKeysParams":{"length":0},"prefixParams":{"length":0},"signedOperationNameParams":{"length":0},"signedOperationOptionsParams":{"length":0},"uploadFileNameParams":{"length":0},"uploadFileTypeParams":{"length":0},"copySourceParams":{"length":0},"tagSetParams":{"length":0}},"queryType":"S3Query","environment":"production","showLatest":false,"isEditorMode":false,"frontendVersion":"1","releaseVersion":null,"includeQueryExecutionMetadata":true,"resourceName":"779072eb-70da-480a-b275-dc5dd9e17500"}',
    method: "POST",
  }
);
