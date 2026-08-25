import "dotenv/config";
import { getBazaarvoiceConfig } from "../config/bazaarvoiceConfig";
import type { Brand } from "../config/smileConfig";

export type BazaarvoiceReview = {
  Id: string;
  UserEmailAddress: string;
};

export async function getReviewById(
  reviewId: string,
  brand: Brand
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

  const delays = [0, 500, 1000, 2000];

  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt] > 0) {
      await new Promise(resolve =>
        setTimeout(resolve, delays[attempt])
      );
    }

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();

      throw new Error(
        `Bazaarvoice API error: ${text}`
      );
    }

    const data = await response.json();

    console.log("BV REVIEW LOOKUP:", {
      brand,
      reviewId,
      attempt: attempt + 1,
      httpStatus: response.status,
      totalResults: data.TotalResults,
      hasErrors: data.HasErrors,
      errors: data.Errors,
    });

    if (data.HasErrors) {
      throw new Error(
        `Bazaarvoice API error for ${brand}: ${JSON.stringify(
          data.Errors
        )}`
      );
    }

    const review = data.Results?.[0];

    if (review) {
      if (!review.UserEmailAddress) {
        throw new Error(
          `Review ${reviewId} has no UserEmailAddress`
        );
      }

      return {
        Id: review.Id,
        UserEmailAddress:
          review.UserEmailAddress,
      };
    }

    console.log(
      `Review ${reviewId} not available yet. Retry ${
        attempt + 1
      }/${delays.length}`
    );
  }

  throw new Error(
    `Review not found after retries: ${reviewId} (${brand})`
  );
}