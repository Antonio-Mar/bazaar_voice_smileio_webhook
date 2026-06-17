import { getBrandConfig } from "../config/getBrandConfig";
import type { EventPayload } from "../schemas/event.schema";

export function calculateReward(event: EventPayload) {
  const config = getBrandConfig(event.brand);

  switch (event.eventType) {
    case "review.approved":
      return {
        shouldReward: true,
        points: config.rewards.reviewApproved,
        reason: "Approved review",
      };

    case "review.edited":
      return {
        shouldReward: true,
        points: config.rewards.reviewEdited,
        reason: "Edited review",
      };

    case "review.rejected":
      return {
        shouldReward: false,
        points: 0,
        reason: "Rejected review",
      };

    default:
      return {
        shouldReward: false,
        points: 0,
        reason: "Unsupported event type",
      };
  }
}