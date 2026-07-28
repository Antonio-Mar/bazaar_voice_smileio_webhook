import type { EventPayload } from "../schemas/event.schema";
import { shouldProcessEvent } from "./idempotency";
import { createEventKey } from "./eventKey";
import { calculateReward } from "./rewardEngine";
import { awardSmilePoints } from "../integrations/smile.client";
import { getSmileCustomerByEmail } from "../integrations/smile.customer";
import { decryptEmail } from "../integrations/bazaarvoiceEmail";
import { logEvent } from "../logging/logger";

export async function processEvent(event: EventPayload) {
  const key = createEventKey(event.source, event.reviewId, event.eventType);

  const timestamp = new Date().toISOString();

  // 1. RECEIVED
  logEvent({
    timestamp,
    reviewId: event.reviewId,
    brand: event.brand,
    eventType: event.eventType,
    status: "RECEIVED",
  });

  // 2. Idempotency gate
  const shouldProcess = await shouldProcessEvent(event);

  if (!shouldProcess) {
    logEvent({
      timestamp,
      reviewId: event.reviewId,
      brand: event.brand,
      eventType: event.eventType,
      status: "DUPLICATE_SKIPPED",
    });

    return {
      success: false,
      reason: "duplicate_event",
    };
  }

  // 3. Calculate reward
  const reward = calculateReward(event);

  logEvent({
    timestamp,
    reviewId: event.reviewId,
    brand: event.brand,
    eventType: event.eventType,
    status: "POINTS_CALCULATED",
  });

  // 4. If no reward, exit cleanly
  if (!reward.shouldReward) {
    return {
      success: true,
      reward,
    };
  }

  try {
    // 5. Customer lookup

    if (!event.encryptedEmail) {
      throw new Error("Missing encrypted email in webhook payload");
    }

    const customerEmail = decryptEmail(event.encryptedEmail, event.brand);

    const customer = await getSmileCustomerByEmail(customerEmail, event.brand);

    logEvent({
      timestamp,
      reviewId: event.reviewId,
      brand: event.brand,
      eventType: event.eventType,
      status: "CUSTOMER_FOUND",
    });

    // 6. Award points
    await awardSmilePoints(event.brand, {
      customerId: customer.id,
      points: reward.points,
    });

    logEvent({
      timestamp,
      reviewId: event.reviewId,
      brand: event.brand,
      eventType: event.eventType,
      status: "POINTS_AWARDED",
    });

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
  }
}
