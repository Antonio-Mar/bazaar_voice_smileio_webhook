import type { EventPayload } from "../schemas/event.schema";
import {
  hasProcessed,
  acquireProcessingLock,
  markProcessed,
  releaseProcessingLock,
} from "./idempotency";

import { createEventKey } from "./eventKey";
import { calculateReward } from "./rewardEngine";
import { awardSmilePoints } from "../integrations/smile.client";
import { getSmileCustomerByEmail } from "../integrations/smile.customer";
import { logEvent } from "../logging/logger";
import { getBazaarvoiceCustomerEmail } from "../integrations/bazaarvoice.customer";

export async function processEvent(
  event: EventPayload
) {
  const key = createEventKey(
    event.source,
    event.reviewId,
    event.eventType
  );

  const timestamp = new Date().toISOString();

  // 1. RECEIVED
  logEvent({
    timestamp,
    reviewId: event.reviewId,
    brand: event.brand,
    eventType: event.eventType,
    status: "RECEIVED",
  });

  // 2. Has this event already completed?
  const alreadyProcessed =
    await hasProcessed(key);

  if (alreadyProcessed) {
    logEvent({
      timestamp,
      reviewId: event.reviewId,
      brand: event.brand,
      eventType: event.eventType,
      status: "DUPLICATE_SKIPPED",
    });

    return {
      success: true,
      skipped: true,
      reason: "duplicate_event",
    };
  }

  // 3. Prevent concurrent processing
  const lockAcquired =
    await acquireProcessingLock(key);

  if (!lockAcquired) {
    console.log(
      "EVENT ALREADY PROCESSING:",
      key
    );

    return {
      success: true,
      skipped: true,
      reason: "event_processing",
    };
  }

  try {
    // 4. Calculate reward
    const reward =
      calculateReward(event);

    logEvent({
      timestamp,
      reviewId: event.reviewId,
      brand: event.brand,
      eventType: event.eventType,
      status: "POINTS_CALCULATED",
    });

    // 5. Event requires no reward
    if (!reward.shouldReward) {
      await markProcessed(key);

      return {
        success: true,
        reward,
      };
    }

    // 6. Fetch Bazaarvoice email
    const customerEmail =
      await getBazaarvoiceCustomerEmail(
        event.reviewId,
        event.brand as any
      );

    // 7. Find Smile customer
    const customer =
      await getSmileCustomerByEmail(
        customerEmail,
        event.brand as any
      );

    logEvent({
      timestamp,
      reviewId: event.reviewId,
      brand: event.brand,
      eventType: event.eventType,
      customerEmail,
      status: "CUSTOMER_FOUND",
    });

    // 8. Award points
    await awardSmilePoints(
      event.brand as any,
      {
        customerId: customer.id,
        points: reward.points,
      }
    );

    logEvent({
      timestamp,
      reviewId: event.reviewId,
      brand: event.brand,
      eventType: event.eventType,
      status: "POINTS_AWARDED",
    });

    // 9. ONLY mark completed after Smile succeeds
    await markProcessed(key);

    return {
      success: true,
      reward,
    };
  } catch (error) {
    logEvent({
      timestamp,
      reviewId: event.reviewId,
      brand: event.brand,
      eventType: event.eventType,
      status: "FAILED",
    });

    throw error;
  } finally {
    // Always release temporary lock
    await releaseProcessingLock(key);
  }
}