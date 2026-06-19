import { logEvent, logError } from "../library/logger";
import { getSmileConfig } from "../config/smileConfig";
import type { Brand } from "../config/smileConfig";

type AwardSmilePointsInput = {
  customerId: number;
  points: number;
  description?: string;
  internalNote?: string;
};

export async function awardSmilePoints(
  brand: Brand,
  input: AwardSmilePointsInput
) {
  const endpoint = process.env.SMILE_API_URL;
  const config = getSmileConfig(brand);
  const apiKey = config.apiKey;

  if (!endpoint || !apiKey) {
    throw new Error(`Missing Smile config for brand: ${brand}`);
  }

  const payload = {
    points_transaction: {
      customer_id: input.customerId,
      points_change: input.points,
      description: input.description ?? "BazaarVoice Review",
      internal_note: input.internalNote ?? "BazaarVoice Review",
    },
  };

  const response = await fetch(`${endpoint}/points_transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Smile API error: ${text}`);
  }

  return response.json();
}