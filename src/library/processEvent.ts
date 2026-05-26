import { createEventKey } from "./eventKey";
import { hasProcessed, markProcessed } from "./idempotencyStore";
import { EventPayload } from "../schemas/event.schema";

export function shouldProcessEvent(event: EventPayload): boolean {
  const key = createEventKey(
    event.source,
    event.reviewId,
    event.eventType
  );

  if (hasProcessed(key)) {
    return false;
  }

  markProcessed(key);
  return true;
}