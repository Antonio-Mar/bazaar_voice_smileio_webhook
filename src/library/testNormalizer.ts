import fs from "fs";
import path from "path";
import { transformToInternalEvent } from "../normalizers/bazaarvoice.normalizer";
import "./bootstrap"

const filePath = path.resolve("bv-payload.json");
const raw = fs.readFileSync(filePath, "utf-8");
const parsed = JSON.parse(raw);

const event = transformToInternalEvent(parsed);

console.log("✅ Normalized Event:");
console.log(event);