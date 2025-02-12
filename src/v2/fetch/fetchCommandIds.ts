import { configDotenv } from "dotenv";
import path from "path";
import fs from "fs";
import { flag } from "..";

configDotenv();

export const outputResponse = path.join(__dirname, "..", "..", "..", "output");
if (!fs.existsSync(outputResponse)) {
  fs.mkdirSync(outputResponse);
}

export const resourcePoll: string[] = [
  "bc3fabcd-da7b-4aa4-9c22-6af10a7b8ffd",
  "779072eb-70da-480a-b275-dc5dd9e17500",
  "d71db4f8-399d-4939-b8d8-00e4ca7fa116",
  "0f990bf4-43d5-4b81-a503-7ad28a024abf",
];

export default async function fetchCommandIds(
  from: string,
  to: string,
  localfilemapping: Map<string, number>
): Promise<string[][]> {
  let jsonRespones;
  // console.log("from date and to erp", from, to);
  // Fetch data
  for (const resource of resourcePoll) {
    let response;
    if (!flag) {
      response = await fetch(
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
    } else {
      response = await fetch(
        `https://retool.internal.cleartax.co/api/pages/uuids/${process.env.ClearTaxId}/query?queryName=get_command_queue_prod`,
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
            timestamp: "1739340287628",
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
    }

    if (response.status === 200) {
      jsonRespones = await response.json();
      fs.writeFileSync(
        path.join(outputResponse, `${process.env.erpInstance}_erp_files.json`),
        JSON.stringify(jsonRespones, null, 2)
      );
      break;
    }
  }

  if (jsonRespones.length < 2) {
    console.log("Couldn't fetch data");
    return [];
  }

  let fromDate: string = "";
  let toDate: string = "";
  // Process the response
  // console.log(jsonRespones);
  for (const data of jsonRespones.queryData) {
    if (data._id == from) {
      console.log(data);
      fromDate = data.createdAt;
    }
    if (data._id == to) {
      console.log(data);
      toDate = data.createdAt;
    }

    if (fromDate.length > 1 && toDate.length > 1) {
      break;
    }
  }
  if (fromDate.length < 2 && toDate.length < 2) {
    console.error("could not find the cmdId for dates from the erplist");
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
      let baseUrl: string = "";
      if (!flag) {
        baseUrl =
          "https://storage.clear.in/v1/ap-south-1/one-integration-staging/";
      } else {
        baseUrl =
          "https://storage.clear.in/v1/ap-south-1/one-integration-prod/";
      }

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
      timestamp: "1739341910215",
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
