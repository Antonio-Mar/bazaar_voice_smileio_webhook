import { redis } from "../integrations/redis";

const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function tryMarkProcessed(
  key: string
): Promise<boolean> {
  const result = await redis.set(key, 1, {
    nx: true,
    ex: TTL_SECONDS,
  });

  return result === "OK";
}