import { transformToInternalEvent } from "../normalizers/bazaarvoice.normalizer";
import { processEvent } from "./processEvent";
import dotenv from "dotenv"

dotenv.config()

const rawPayload = {
  event: "review_approved",
  brand: "rocky",
  review: {
    id: "BVreview00001",
    productId: "sku_987",
    rating: 5,
    locale: "en_US",
    createdAt: "2026-05-21T16:00:00Z",
  },
  customer: {
    email: "crispy1260@yahoo.com",
  },
};

async function run() {
  const event = transformToInternalEvent(rawPayload);

  console.log("FIRST RUN");
  console.log(await processEvent(event));

  console.log("SECOND RUN");
  console.log(await processEvent(event));
}

run();