import { logEvent, logError } from "../library/logger";

type AwardSmilePointsInput = {
  customerEmail: string;
  points: number;
  reason?: string;
};

export async function awardSmilePoints({
  customerEmail,
  points,
  reason,
}: AwardSmilePointsInput) {
  const endpoint = process.env.SMILE_API_URL;
  const apiKey = process.env.SMILE_API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error("Missing Smile API configuration");
  }

  const response = await fetch(`${endpoint}/points`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      customer_email: customerEmail,
      points,
      reason: reason ?? "bazaarvoice_review",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Smile API error: ${text}`);
  }

  return response.json();
}