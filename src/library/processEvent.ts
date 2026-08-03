import { EventSchema, type EventPayload } from "../schemas/event.schema";
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
  // TEMPORARILY DISABLED FOR TESTING
  console.log("IDEMPOTENCY BYPASSED:", key);

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

    // event.brand can be a union of string literals not matching the Brand type expected
    // by decryptEmail. Narrow/cast here to satisfy the expected parameter type.
    const customerEmail = decryptEmail(event.encryptedEmail, event.brand as any);

    const customer = await getSmileCustomerByEmail(customerEmail, event.brand as any);

    logEvent({
      timestamp,
      reviewId: event.reviewId,
      brand: event.brand,
      eventType: event.eventType,
      customerEmail: customerEmail,
      status: "CUSTOMER_FOUND",
    });

    // 6. Award points
    await awardSmilePoints(event.brand as any, {
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
