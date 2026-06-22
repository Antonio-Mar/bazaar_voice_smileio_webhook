import { createEventKey } from "./eventKey";
import { EventPayload } from "../schemas/event.schema";
import { tryMarkProcessed } from "./idempotencyStore";

export async function shouldProcessEvent(event: EventPayload): Promise<boolean> {
  const key = createEventKey(
    event.source,
    event.reviewId,
    event.eventType
  );

  return await tryMarkProcessed(key);
}