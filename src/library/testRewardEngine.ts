import { transformToInternalEvent } from "../normalizers/bazaarvoice.normalizer";
import { calculateReward } from "./rewardEngine";
import { getBrandConfig } from "../config/getBrandConfig";
import "./bootstrap"

const rawPayload = {
  event: "review_approved",
  brand: "rocky",
  review: {
    id: "rev_123",
    productId: "sku_987",
    rating: 5,
    locale: "en_US",
    createdAt: "2026-05-21T16:00:00Z",
  },
  customer: {
    email: "test@example.com",
  },
};


const event = transformToInternalEvent(rawPayload);

const decision = calculateReward(event);

console.log(decision);