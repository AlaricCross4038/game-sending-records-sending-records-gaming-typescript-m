import { readFile } from "node:fs/promises";
import { InfraiClient } from "./record-client.ts";
import { publishSendingRecords } from "./publish-records.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");
const inputPath = process.argv[2] ?? "game-domain.json";
const input = JSON.parse(await readFile(inputPath, "utf8"));
const result = await publishSendingRecords(new InfraiClient(key), input);
console.log(JSON.stringify(result, null, 2));
