import type { EventPayload } from "../schemas/event.schema";
import { shouldProcessEvent } from "./idempotency";
import { calculateReward } from "./rewardEngine";
import { awardSmilePoints } from "../integrations/smile.client";
import { getSmileCustomerByEmail } from "../integrations/smile.customer";

export async function processEvent(event: EventPayload) {
    // 1. Idempotency gate
    if (!shouldProcessEvent(event)) {
        return {
            success: false,
            reason: "duplicate_event",
        };
    }

    // 2. Business logic
    const reward = calculateReward(event);

    // 3. Side effect (Smile)
    if (reward.points > 0) {
        const customer = await getSmileCustomerByEmail(
            event.customerEmail
        );

        await awardSmilePoints({
            customerId: customer.id,
            points: reward.points,
        });
    }

    return {
        success: true,
        reward,
    };
}