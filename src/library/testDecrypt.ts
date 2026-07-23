import "./bootstrap";
import { getReviewById } from "../integrations/bazaarvoice.client";
import { decryptEmail } from "../integrations/bazaarvoiceEmail";

async function run() {
  const review = await getReviewById(
    "302052595"
  );

  console.log(
    "Encrypted:",
    review.UserEmailAddress
  );

  const email = decryptEmail(
    review.UserEmailAddress
  );

  console.log(
    "Decrypted:",
    email
  );
}

run();