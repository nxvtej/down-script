import { configDotenv } from "dotenv";

configDotenv();
export const ClearTaxUrl = `https://retool.internal.cleartax.co/api/pages/uuids/${process.env.ClearTaxId}/query?queryName=download_staging_zip_file`;
