import { getReviewById } from "../integrations/bazaarvoice.client";
import { decryptEmail } from "../integrations/bazaarvoiceEmail";

async function run() {
  const brand = "rocky"; // Replace with the desired brand

  const review = await getReviewById("305939623", "rocky");

  const email = decryptEmail(review.UserEmailAddress, brand);

  console.log("Decrypted email:", email);
}

run();
