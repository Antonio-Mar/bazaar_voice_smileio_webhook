import type { Brand } from "../config/smileConfig";
import { getReviewById } from "./bazaarvoice.client";
import { decryptEmail } from "./bazaarvoiceEmail";

export async function getBazaarvoiceCustomerEmail(
  reviewId: string,
  brand: Brand
): Promise<string> {
  const review = await getReviewById(
    reviewId,
    brand
  );

  return decryptEmail(
    review.UserEmailAddress,
    brand
  );
}