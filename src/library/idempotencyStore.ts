import { redis } from "../integrations/redis";

const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function tryMarkProcessed(
  key: string
): Promise<boolean> {

  const existing = await redis.get(key);

  console.log("REDIS EXISTING:", key, existing);

  const result = await redis.set(key, 1, {
    nx: true,
    ex: TTL_SECONDS,
  });

  console.log("REDIS SET RESULT:", result);

  return result === "OK";
}