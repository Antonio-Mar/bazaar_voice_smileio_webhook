import { getReviewById } from "../integrations/bazaarvoice.client";
import { decryptEmail } from "../integrations/bazaarvoiceEmail";

async function run() {
  const brand = "georgia";

  const review = await getReviewById(
    "303641585",
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

  console.log("Encrypted email:", review.userEmailAddress);

  const email = decryptEmail(
    review.userEmailAddress,
    brand
  );

  console.log("Decrypted email:", email);
}

run();