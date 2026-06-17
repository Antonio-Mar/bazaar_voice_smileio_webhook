import type { EventPayload } from "../schemas/event.schema";
import { shouldProcessEvent } from "./idempotency";
import { calculateReward } from "./rewardEngine";
import { awardSmilePoints } from "../integrations/smile.client";
import { getSmileCustomerByEmail } from "../integrations/smile.customer";
import { logEvent } from "../logging/logger";

export async function processEvent(event: EventPayload) {
  const timestamp = new Date().toISOString();

  // 1. RECEIVED
  logEvent({
    timestamp,
    reviewId: event.reviewId,
    customerEmail: event.customerEmail,
    brand: event.brand,
    eventType: event.eventType,
    status: "RECEIVED",
  });

  // 2. Idempotency gate
  if (!shouldProcessEvent(event)) {
    logEvent({
      timestamp,
      reviewId: event.reviewId,
      customerEmail: event.customerEmail,
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
    customerEmail: event.customerEmail,
    brand: event.brand,
    eventType: event.eventType,
    rewardPoints: reward.points,
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
    const customer = await getSmileCustomerByEmail(event.customerEmail);

    logEvent({
      timestamp,
      reviewId: event.reviewId,
      customerEmail: event.customerEmail,
      brand: event.brand,
      eventType: event.eventType,
      rewardPoints: reward.points,
      status: "CUSTOMER_FOUND",
    });

    // 6. Award points
    await awardSmilePoints({
      customerId: customer.id,
      points: reward.points,
    });

    logEvent({
      timestamp,
      reviewId: event.reviewId,
      customerEmail: event.customerEmail,
      brand: event.brand,
      eventType: event.eventType,
      rewardPoints: reward.points,
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
      customerEmail: event.customerEmail,
      brand: event.brand,
      eventType: event.eventType,
      rewardPoints: reward.points,
      status: "FAILED",
    });

    throw error;
  }
}