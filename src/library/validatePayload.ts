import fs from "fs";
import path from "path";
import { EventSchema } from "../schemas/event.schema";

const filePath = path.resolve("payload.json");
const raw = fs.readFileSync(filePath, "utf-8");
const parsed = JSON.parse(raw);

const result = EventSchema.safeParse(parsed);

if (!result.success) {
  console.error("❌ Invalid payload");
  console.error(result.error.format());
  process.exit(1);
}

console.log("✅ Payload valid");
console.log(result.data);