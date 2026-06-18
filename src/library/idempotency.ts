import { createEventKey } from "./eventKey";
import { hasProcessed } from "./idempotencyStore";
import { EventPayload } from "../schemas/event.schema";

export function shouldProcessEvent(event: EventPayload): boolean {
  const key = createEventKey(
    event.source,
    event.reviewId,
    event.eventType
  );

  return !hasProcessed(key);
}