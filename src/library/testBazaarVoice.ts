import { getReviewById } from "../integrations/bazaarvoice.client";
import "dotenv/config";

async function run() {
  const review = await getReviewById(
    "305607786",
    "rocky",
  );

  console.log(review);
}

run();