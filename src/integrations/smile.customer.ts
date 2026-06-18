import dotenv from "dotenv";

dotenv.config();

export async function getSmileCustomerByEmail(email: string) {
  const endpoint = process.env.SMILE_API_URL;
  const apiKey = process.env.SMILE_API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error("Missing Smile API configuration");
  }

  const url =
    `${endpoint}/customers?limit=1&email=${encodeURIComponent(email)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const data = await res.json();

  console.log("Smile Customer Search:", JSON.stringify(data, null, 2));

  const customer = data.customers?.[0];

  if (!customer) {
    throw new Error(
      `No Smile customer found for email: ${email}`
    );
  }

  return customer;
}