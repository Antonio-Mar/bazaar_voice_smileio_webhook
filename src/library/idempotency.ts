import { redis } from "../integrations/redis";

const COMPLETED_TTL_SECONDS = 60 * 60 * 24 * 7;
const LOCK_TTL_SECONDS = 60 * 5;

function completedKey(key: string) {
  return `completed:${key}`;
}

function lockKey(key: string) {
  return `processing:${key}`;
}

export async function hasProcessed(
  key: string
): Promise<boolean> {
  const result = await redis.exists(
    completedKey(key)
  );

  return result === 1;
}

export async function acquireProcessingLock(
  key: string
): Promise<boolean> {
  const result = await redis.set(
    lockKey(key),
    1,
    {
      nx: true,
      ex: LOCK_TTL_SECONDS,
    }
  );

  return result === "OK";
}

export async function markProcessed(
  key: string
): Promise<void> {
  await redis.set(
    completedKey(key),
    1,
    {
      ex: COMPLETED_TTL_SECONDS,
    }
  );
}

export async function releaseProcessingLock(
  key: string
): Promise<void> {
  await redis.del(lockKey(key));
}