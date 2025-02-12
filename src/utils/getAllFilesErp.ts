import { configDotenv } from "dotenv";
import { generateKey } from "../date/formateDate";
import filterKeysInDateRange from "../filter/filter";
import path from "path";
import fs from "fs";
configDotenv();

export const resourcePoll: string[] = [];
export const outputResponse = path.join(__dirname, "..", "..", "output");
if (!fs.existsSync(outputResponse)) {
  fs.mkdirSync(outputResponse);
}

resourcePoll.push("779072eb-70da-480a-b275-dc5dd9e17500");
resourcePoll.push("d71db4f8-399d-4939-b8d8-00e4ca7fa116");

export default async function fetchFromErp(
  fromDate: string,
  toDate: string,
  localFilesMap: Map<string, string[]>
): Promise<Map<string, string[]>> {
  let jsonRespones;
  let erpFilesMap: Map<string, string[]> = new Map<string, string[]>();
  let response: any;

  const notCompleted: string[] = [];
  for (const resource of resourcePoll) {
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

    if (response.status == 200) {
      jsonRespones = await response.json();
      await fs.writeFileSync(
        path.join(outputResponse, `${process.env.erpInstance}_erp_files.json`),
        JSON.stringify(jsonRespones, null, 2)
      );
      break;
    }
  }
  if (response.status != 200) {
    console.log("response if not 200", response);
    process.exit(1);
  }

  console.log("--------------");

  const length = jsonRespones.queryData.length;
  console.log("erp length is :- ", length);
  const queryData = jsonRespones.queryData;
  // const jsonstring = JSON.stringify(queryData, null, 2);
  // console.log("query data", jsonstring);
  let count = 0;

  for (let i = 0; i < length; i++) {
    const data = queryData[i];
    if (
      (data.status != "COMPLETED" && data.status != "FAILED") ||
      data.timeState.length == 0
    ) {
      count++;
      notCompleted.push(data._id);
      continue;
    }

    const { fromDateTime, toDateTime } = data.timeState[0];
    // / "fromDateTime": "2024-08-01T00:00:00.000Z",
    // "toDateTime": "2024-08-02T00:00:00.000Z"
    const { createdAt } = data;
    // "createdAt": "2025-01-11T06:19:42.385Z",

    const commandId = data._id;
    const originalUrl: string = data.resultData.s3Details[0].url;

    if (originalUrl!.length < 1) {
      console.log("new format required bro, url missing for", commandId);
      continue;
    }
    const url = extractPath(originalUrl);

    const createdAtDate = createdAt.slice(0, 10);
    const oldformatTime = createdAt.slice(11, -1);
    const createdAtTime = oldformatTime.replace(/:/g, "_");

    const key = generateKey(fromDateTime, toDateTime);
    erpFilesMap.set(key, [commandId, createdAtDate, createdAtTime, url]);
  }

  console.log("before the filter all erp files", erpFilesMap.size);
  for (const [key, values] of erpFilesMap) {
    console.log("key:", key, "value is:", values);
    break;
  }
  console.log("Skipped count: ", count);

  const returnvalue = filterKeysInDateRange(
    erpFilesMap,
    localFilesMap,
    fromDate,
    toDate
  );

  console.log(
    "status not completed ids examples",
    notCompleted[0],
    " total acount is:: ",
    notCompleted.length
  );
  return returnvalue;
}

function extractPath(url: string): string {
  const basePath =
    "https://storage.clear.in/v1/ap-south-1/one-integration-staging/";
  return url.replace(basePath, "");
}
