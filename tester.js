const response = await fetch(
  "https://retool.internal.cleartax.co/api/pages/uuids/{}/query?queryName=get_command_queue",
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
      timestamp: "1739203338033",
      "x-retool-client-version": "2.113.22-9dddc16 (Build 1874)",
      "x-xsrf-token": "xx",
      cookie:
      Referer: "https://retool.internal.cleartax.co/",
      "Referrer-Policy": "origin",
    },
    body: '{"userParams":{"fieldParams":{"length":0},"queryParams":{"0":"xx","length":1},"updateParams":{"length":0},"insertParams":{"length":0},"projectionParams":{"length":0},"optionsParams":{"length":0},"sortByParams":{"length":0},"skipParams":{"length":0},"limitParams":{"length":0},"aggregationParams":{"length":0},"collectionParams":{"length":0},"databaseParams":{},"operationsParams":{},"hintParams":{}},"queryType":"NoSqlQuery","environment":"production","showLatest":false,"isEditorMode":false,"frontendVersion":"1","releaseVersion":null,"includeQueryExecutionMetadata":true,"resourceName":"xx"}',
    method: "POST",
  }
);
console.log(await response.json());
