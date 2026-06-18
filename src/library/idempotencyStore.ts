import fs from "fs";
import path from "path";
import { createEventKey } from "./eventKey";

const filePath = path.resolve(".idempotency-store.json");

function readStore(): Record<string, boolean> {

  try {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, boolean>) {
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
}

export function hasProcessed(key: string): boolean {
  const store = readStore();
  return !!store[key];
}

export function markProcessed(key: string): void {
  const store = readStore();
  store[key] = true;
  writeStore(store);
}