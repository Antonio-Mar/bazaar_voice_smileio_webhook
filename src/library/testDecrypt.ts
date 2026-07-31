import { getReviewById } from "../integrations/bazaarvoice.client";
import { decryptEmail } from "../integrations/bazaarvoiceEmail";

async function run() {
  const brand = "durango";

  const review = await getReviewById(
    "304278237",
    brand
  );

  console.log(
  "BAZAARVOICE REVIEW RAW:",
  JSON.stringify(review, null, 2)
);

  console.log(
  "FULL REVIEW:",
  JSON.stringify(review, null, 2)
);

  console.log("Encrypted email:", review.UserEmailAddress);

  const email = decryptEmail(
    review.UserEmailAddress,
    brand
  );

  console.log("Decrypted email:", email);
}

run();