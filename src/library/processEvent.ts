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
  const key = createEventKey(
    event.source,
    event.reviewId,
    event.eventType,
  );

  const baseLog = () => ({
    timestamp: new Date().toISOString(),
    reviewId: event.reviewId,
    brand: event.brand,
    eventType: event.eventType,
  });

  // 1. Event received
  logEvent({
    ...baseLog(),
    status: "RECEIVED",
  });

  // 2. Check whether event has already completed
  const alreadyProcessed = await hasProcessed(key);

  if (alreadyProcessed) {
    logEvent({
      ...baseLog(),
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
    console.warn("Event already processing", {
      reviewId: event.reviewId,
      brand: event.brand,
      eventType: event.eventType,
    });

    return {
      success: true,
      skipped: true,
      reason: "event_processing",
    };
  }

  try {
    let reward:
      | ReturnType<typeof calculateReward>
      | undefined;

    // 4. Calculate rewards for events that do not require VIP status
    if (event.eventType !== "review.approved") {
      reward = calculateReward(event);

      logEvent({
        ...baseLog(),
        rewardPoints: reward.points,
        status: "POINTS_CALCULATED",
      });

      // Example: rejected reviews
      if (!reward.shouldReward) {
        await markProcessed(key);

        return {
          success: true,
          reward,
        };
      }
    }

    // 5. Retrieve customer email from Bazaarvoice
    const customerEmail =
      await getBazaarvoiceCustomerEmail(
        event.reviewId,
        event.brand as any,
      );

    // 6. Find customer in Smile
    const customer =
      await getSmileCustomerByEmail(
        customerEmail,
        event.brand as any,
      );

    logEvent({
      ...baseLog(),
      status: "CUSTOMER_FOUND",
    });

    // 7. Approved reviews use VIP tier rewards
    if (event.eventType === "review.approved") {
      const vipTierId =
        customer.vip_status?.vip_tier_id;

      if (vipTierId == null) {
        throw new Error(
          `Smile customer has no VIP tier`,
        );
      }

      const vipTierName =
        await getSmileVipTierName(
          event.brand as any,
          vipTierId,
        );

      reward = calculateReward(
        event,
        vipTierName,
      );

      logEvent({
        ...baseLog(),
        rewardPoints: reward.points,
        status: "POINTS_CALCULATED",
      });
    }

    // Safety check
    if (!reward || !reward.shouldReward) {
      throw new Error(
        `Reward was not calculated for ${event.eventType}`,
      );
    }

    // 8. Award Smile points
    await awardSmilePoints(
      event.brand as any,
      {
        customerId: customer.id,
        points: reward.points,
      },
    );

    logEvent({
      ...baseLog(),
      rewardPoints: reward.points,
      status: "POINTS_AWARDED",
    });

    // 9. Mark complete only after Smile succeeds
    await markProcessed(key);

    return {
      success: true,
      reward,
    };
  } catch (error) {
    logEvent({
      ...baseLog(),
      status: "FAILED",
    });

    throw error;
  } finally {
    // 10. Always release the temporary lock
    await releaseProcessingLock(key);
  }
}