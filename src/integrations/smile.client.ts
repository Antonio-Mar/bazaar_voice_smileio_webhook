import { logEvent, logError } from "../library/logger";
import dotenv from "dotenv"

dotenv.config()

type AwardSmilePointsInput = {
  customerId: number;
  points: number;
};

export async function awardSmilePoints({
  customerId,
  points,
}: AwardSmilePointsInput) {
  const endpoint = process.env.SMILE_API_URL;
  const apiKey = process.env.SMILE_API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error("Missing Smile API configuration");
  }

  const payload = {
    points_transaction: {
      customer_id: customerId,
      points_change: points,
      description: "BazaarVoice Review",
      internal_note: "BazaarVoice Review",
    },
  };

  console.log(
    "Smile Payload:",
    JSON.stringify(payload, null, 2)
  );

  const response = await fetch(
    `${endpoint}/points_transactions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Smile API error: ${text}`);
  }

  return response.json();
}