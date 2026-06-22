import { transformToInternalEvent } from "../normalizers/bazaarvoice.normalizer";
import { processEvent } from "./processEvent";
import "./bootstrap";

const rawPayload = {
  event: "review_approved",
  brand: "georgia",
  review: {
    id: "BVreview00005",
    productId: "DB300536",
    rating: 5,
    locale: "en_US",
    createdAt: "2026-05-21T16:00:00Z",
  },
  customer: {
    email: "antonio.marino@Rockybrands.com",
  },
};

async function run() {
  const event = transformToInternalEvent(rawPayload);

  console.log("FIRST RUN");
  console.log(await processEvent(event));
}

run();