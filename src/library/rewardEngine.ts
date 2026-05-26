import type { EventPayload } from "../schemas/event.schema";

export type RewardDecision = {
  shouldReward: boolean;
  points: number;
  reason: string;
};

export function evaluateReward(event: EventPayload): RewardDecision {
  switch (event.eventType) {
    case "review.approved":
      return {
        shouldReward: true,
        points: 50,
        reason: "Approved review",
      };

    case "review.edited":
      return {
        shouldReward: true,
        points: 10,
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