import { getSmileConfig } from "../config/smileConfig";
import type { Brand } from "../config/smileConfig";

export async function getSmileCustomerByEmail(
    email: string,
    brand: Brand,
) {
    const endpoint = process.env.SMILE_API_URL;
    const config = getSmileConfig(brand);
    const apiKey = config.apiKey;

    if (!endpoint) {
        throw new Error("Missing SMILE_API_URL");
    }

    if (!apiKey) {
        throw new Error(`Missing API key for brand: ${brand}`);
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