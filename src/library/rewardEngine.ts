import { getBrandConfig } from "../config/getBrandConfig";
import type { EventPayload } from "../schemas/event.schema";

export function calculateReward(
  event: EventPayload,
  vipTierName?: string
) {
  const config = getBrandConfig(event.brand);

  switch (event.eventType) {
    case "review.approved": {
      if (!vipTierName) {
        throw new Error(
          `Missing VIP tier for approved review ${event.reviewId}`
        );
      }

      const tierKey = vipTierName
        .trim()
        .toLowerCase();

      const points =
        config.rewards.reviewApproved[tierKey];

      if (points === undefined) {
        throw new Error(
          `No review reward configured for VIP tier "${vipTierName}" on ${event.brand}`
        );
      }

      return {
        shouldReward: true,
        points,
        reason: `Approved review - ${vipTierName}`,
      };
    }

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