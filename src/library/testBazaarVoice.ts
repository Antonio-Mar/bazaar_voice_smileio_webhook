import { getReviewById } from "../integrations/bazaarvoice.client";
import "dotenv/config";

async function run() {
  const review = await getReviewById(
    "302052595"
  );

  console.log(review);
}

run();