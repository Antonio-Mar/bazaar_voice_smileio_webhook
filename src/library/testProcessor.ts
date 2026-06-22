import { transformToInternalEvent } from "../normalizers/bazaarvoice.normalizer";
import { shouldProcessEvent } from "./idempotency";
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

console.log("First attempt:", shouldProcessEvent(event));
console.log("Second attempt:", shouldProcessEvent(event));