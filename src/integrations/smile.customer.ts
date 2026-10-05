import { getSmileConfig } from "../config/smileConfig";
import type { Brand } from "../config/smileConfig";

export type SmileCustomer = {
  id: number;
  email: string;

  vip_status?: {
    vip_tier_id: number | null;
  };
};

export async function getSmileCustomerByEmail(
  email: string,
  brand: Brand
): Promise<SmileCustomer> {
  const endpoint = process.env.SMILE_API_URL;

  const config = getSmileConfig(brand);
  const apiKey = config.apiKey;

  if (!endpoint) {
    throw new Error("Missing SMILE_API_URL");
  }

  if (!apiKey) {
    throw new Error(
      `Missing API key for brand: ${brand}`
    );
  }

  const url =
    `${endpoint}/customers` +
    `?limit=10` +
    `&email=${encodeURIComponent(email)}` +
    `&include=vip_status`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();

    throw new Error(
      `Smile customer lookup failed for ${brand}: ${text}`
    );
  }

  const data = await res.json();

  console.log(
    "Smile Customer Search:",
    JSON.stringify(data, null, 2)
  );

  const customer = data.customers?.[0];

  if (!customer) {
    throw new Error(
      `No Smile customer found for email: ${email}`
    );
  }

  return customer;
}