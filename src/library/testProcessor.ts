import { transformToInternalEvent } from "../normalizers/bazaarvoice.normalizer";
import { processEvent } from "./processEvent";
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

async function run() {
  const event =
    transformToInternalEvent(rawPayload);

  console.log("Normalized event:", event);

  const result =
    await processEvent(event);

  console.log("Process result:", result);
}

run().catch((error) => {
  console.error("Test failed:", error);
});