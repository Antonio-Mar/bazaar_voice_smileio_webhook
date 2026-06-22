import type { EventPayload } from "../schemas/event.schema";
import { shouldProcessEvent } from "./idempotency";
import { tryMarkProcessed } from "./idempotencyStore"
import { createEventKey } from "./eventKey";
import { calculateReward } from "./rewardEngine";
import { awardSmilePoints } from "../integrations/smile.client";
import { getSmileCustomerByEmail } from "../integrations/smile.customer";
import { logEvent } from "../logging/logger";


export async function processEvent(event: EventPayload) {
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
        customerEmail: event.customerEmail,
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

    const result1 = await processEvent(event);
    console.log(result1);

    const result2 = await processEvent(event);
    console.log(result2);

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
        const customer = await getSmileCustomerByEmail(event.customerEmail, event.brand);

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
        await awardSmilePoints(event.brand, {
            customerId: customer.id,
            points: reward.points,
        });

        // ONLY after success
        tryMarkProcessed(key);

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