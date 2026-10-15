import { transformToInternalEvent } from "../normalizers/bazaarvoice.normalizer";
import { calculateReward } from "./rewardEngine";
import "./bootstrap";

const rawPayload = {
  Metadata: {
    eventType: "cgc.review.status.approved.v1",
    occurredAt: "2026-05-21T16:00:00Z",
  },

  CurrentState: {
    id: "rev_123",
    rating: 5,
    contentLocale: "en_US",
    sourceClient: "rockyboots",
    userEmailAddress: "TEST_ENCRYPTED_EMAIL",

    SubjectProduct: {
      productId: "sku_987",
    },
  },
};

const event =
  transformToInternalEvent(rawPayload);

const decision =
  calculateReward(
    event,
    "gold"
  );

console.log(decision);