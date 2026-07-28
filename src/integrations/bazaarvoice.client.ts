import "dotenv/config";
import { getBazaarvoiceConfig } from "../config/bazaarvoiceConfig";
import type { Brand } from "../config/smileConfig";

export type BazaarvoiceReview = {
  Id: string;
  UserEmailAddress: string;
};

export async function getReviewById(
  reviewId: string,
  brand: Brand,
): Promise<BazaarvoiceReview> {

  const config = getBazaarvoiceConfig(brand);

  const apiUrl = config.apiUrl;
  const passKey = config.apiKey;

  if (!apiUrl || !passKey) {
    throw new Error(
      `Missing Bazaarvoice API configuration for ${brand}`
    );
  }

  const url =
    `${apiUrl}/data/reviews.json` +
    `?ApiVersion=5.4` +
    `&PassKey=${passKey}` +
    `&Filter=Id:${reviewId}`;

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `Bazaarvoice API error: ${text}`
    );
  }

  const data = await response.json();

  const review = data.Results?.[0];

  if (!review) {
    throw new Error(
      `Review not found: ${reviewId}`
    );
  }

  return {
    Id: review.Id,
    UserEmailAddress: review.UserEmailAddress,
  };
}