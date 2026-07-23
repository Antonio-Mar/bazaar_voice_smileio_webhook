import { getReviewById } from "./bazaarvoice.client";
import { decryptEmail } from "./bazaarvoiceEmail";

export async function getBazaarvoiceCustomerEmail(
  reviewId: string
): Promise<string> {
  const review = await getReviewById(reviewId);

  return decryptEmail(review.UserEmailAddress);
}