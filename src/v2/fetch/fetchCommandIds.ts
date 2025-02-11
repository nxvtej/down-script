import { configDotenv } from "dotenv";
import path from "path";
import fs from "fs";

configDotenv();

export const outputResponse = path.join(__dirname, "..", "..", "..", "output");
if (!fs.existsSync(outputResponse)) {
  fs.mkdirSync(outputResponse);
}

export const resourcePoll: string[] = [
  "779072eb-70da-480a-b275-dc5dd9e17500",
  "d71db4f8-399d-4939-b8d8-00e4ca7fa116",
];

const baseUrl =
  "https://storage.clear.in/v1/ap-south-1/one-integration-staging/";

export default async function fetchCommandIds(
  from: string,
  to: string,
  localfilemapping: Map<string, number>
): Promise<string[][]> {
  let jsonRespones;
  // console.log("from date and to erp", from, to);
  // Fetch data
  for (const resource of resourcePoll) {
    const response = await fetch(
      `https://retool.internal.cleartax.co/api/pages/uuids/${process.env.ClearTaxId}/query?queryName=get_command_queue`,
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
          timestamp: "1738917975789",
          "x-retool-client-version": "2.113.22-9dddc16 (Build 1874)",
          "x-xsrf-token": `${process.env.xXsrfToken}`,
          cookie: `${process.env.ACCESS_TOKEN}`,
          Referer: "https://retool.internal.cleartax.co/",
          "Referrer-Policy": "origin",
        },
        body: `{"userParams":{"fieldParams":{"length":0},"queryParams":{"0":"${process.env.erpInstance}","length":1},"updateParams":{"length":0},"insertParams":{"length":0},"projectionParams":{"length":0},"optionsParams":{"length":0},"sortByParams":{"length":0},"skipParams":{"length":0},"limitParams":{"length":0},"aggregationParams":{"length":0},"collectionParams":{"length":0},"databaseParams":{},"operationsParams":{},"hintParams":{}},"queryType":"NoSqlQuery","environment":"production","showLatest":false,"isEditorMode":false,"frontendVersion":"1","releaseVersion":null,"includeQueryExecutionMetadata":true,"resourceName":"${resource}"}`,
        method: "POST",
      }
    );

    if (response.status === 200) {
      jsonRespones = await response.json();
      fs.writeFileSync(
        path.join(outputResponse, `${process.env.erpInstance}_erp_files.json`),
        JSON.stringify(jsonRespones, null, 2)
      );
      break;
    }
  }

  if (!jsonRespones) {
    console.log("Couldn't fetch data");
    return [];
  }

  let fromDate: string = "";
  let toDate: string = "";
  // Process the response
  for (const data of jsonRespones.queryData) {
    if (data._id == from) {
      fromDate = data.createdAt;
    }
    if (data._id == to) {
      toDate = data.createdAt;
    }

    if (fromDate.length > 1 && toDate.length > 1) {
      break;
    }
  }
  if (fromDate.length < 2 && toDate.length < 2) {
    console.error("could not load the dates from the erplist");
    process.exit(1);
  }
  // now try getting all _id from createdAt to date - just time concept

  console.log("sending date ", fromDate, toDate);
  if (new Date(fromDate) > new Date(toDate)) {
    [fromDate, toDate] = [toDate, fromDate];
  }
  const erpFilesMappingViaCommandId: string[][] = await applyFilter(
    jsonRespones,
    fromDate,
    toDate,
    localfilemapping
  );

  return erpFilesMappingViaCommandId;
}

async function applyFilter(
  jsonRespones: any,

  fromDate: string,
  toDate: string,
  localfilemapping: Map<string, number>
): Promise<string[][]> {
  const erpFilesMappingViaCommandId: string[][] = [];
  for (const data of jsonRespones.queryData) {
    if (
      !localfilemapping.has(data._id) &&
      data.createdAt && // ensure createdAt exists
      isDateBetween(data.createdAt, fromDate, toDate) &&
      (data.status === "COMPLETED" || data.status === "FAILED") &&
      data.resultData?.s3Details?.length > 0
    ) {
      const url = data.resultData.s3Details[0].url.replace(baseUrl, "");
      erpFilesMappingViaCommandId.push([data._id, url]);
    }
  }
  return erpFilesMappingViaCommandId;
}

function isDateBetween(
  testDate: string,
  startDate: string,
  endDate: string
): boolean {
  try {
    const test = new Date(testDate);
    const start = new Date(startDate);
    const end = new Date(endDate);

    // console.log("tresting date", test, "startdate", start, "end date", end);
    //                                                  ^                   ^
    // Validate dates
    if (
      isNaN(test.getTime()) ||
      isNaN(start.getTime()) ||
      isNaN(end.getTime())
    ) {
      console.error("Invalid date format");
      return false;
    }

    return test >= start && test <= end;
  } catch (error) {
    console.error("Error comparing dates:", error);
    return false;
  }
}
