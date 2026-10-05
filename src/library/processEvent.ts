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
import { getSmileVipTierName } from "../integrations/smile.vip";

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

  // 2. Has this event already completed?
  const alreadyProcessed = await hasProcessed(key);

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
  const lockAcquired = await acquireProcessingLock(key);

  if (!lockAcquired) {
    console.log("EVENT ALREADY PROCESSING:", key);

    return {
      success: true,
      skipped: true,
      reason: "event_processing",
    };
  }

  try {
    // 4. Handle events that do NOT need VIP tier lookup
    if (event.eventType !== "review.approved") {
      const reward = calculateReward(event);

      logEvent({
        timestamp,
        reviewId: event.reviewId,
        brand: event.brand,
        eventType: event.eventType,
        rewardPoints: reward.points,
        status: "POINTS_CALCULATED",
      });

      if (!reward.shouldReward) {
        await markProcessed(key);

        return {
          success: true,
          reward,
        };
      }

      // if adding review edited or other events that don't require VIP tier, you can add them here
    }

    // 5. Fetch Bazaarvoice email
    const customerEmail = await getBazaarvoiceCustomerEmail(
      event.reviewId,
      event.brand as any,
    );

    // 6. Find Smile customer
    const customer = await getSmileCustomerByEmail(
      customerEmail,
      event.brand as any,
    );

    logEvent({
      timestamp,
      reviewId: event.reviewId,
      brand: event.brand,
      eventType: event.eventType,
      customerEmail,
      status: "CUSTOMER_FOUND",
    });

    // 7. Get Smile VIP tier
    const vipTierId = customer.vip_status?.vip_tier_id;

    if (vipTierId == null) {
      throw new Error(`Smile customer ${customer.id} has no VIP tier`);
    }

    const vipTierName = await getSmileVipTierName(
      event.brand as any,
      vipTierId,
    );

    console.log("SMILE VIP TIER:", {
      customerId: customer.id,
      vipTierId,
      vipTierName,
    });

    // 8. Calculate reward using VIP tier
    const reward = calculateReward(event, vipTierName);

    console.log("REWARD CHECK:", {
      brand: event.brand,
      vipTierName,
      tierKey: vipTierName.trim().toLowerCase(),
      points: reward.points,
      reason: reward.reason,
    });

    logEvent({
      timestamp,
      reviewId: event.reviewId,
      brand: event.brand,
      eventType: event.eventType,
      rewardPoints: reward.points,
      status: "POINTS_CALCULATED",
    });

    // 9. Award points
    await awardSmilePoints(event.brand as any, {
      customerId: customer.id,
      points: reward.points,
    });

    logEvent({
      timestamp,
      reviewId: event.reviewId,
      brand: event.brand,
      eventType: event.eventType,
      rewardPoints: reward.points,
      status: "POINTS_AWARDED",
    });

    // 10. Mark completed ONLY after points succeed
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
    await releaseProcessingLock(key);
  }
}
