import { getSmileConfig } from "../config/smileConfig";
import type { Brand } from "../config/smileConfig";

type SmileVipTier = {
  id: number;
  name: string;
};

export async function getSmileVipTierName(
  brand: Brand,
  vipTierId: number
): Promise<string> {
  const config = getSmileConfig(brand);

  const response = await fetch(
    "https://api.smile.io/v1/vip_tiers",
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `Smile VIP tier API error for ${brand}: ${text}`
    );
  }

  const data = await response.json();

  const tiers: SmileVipTier[] =
    data.vip_tiers ?? [];

  const tier = tiers.find(
    tier => tier.id === vipTierId
  );

  if (!tier) {
    throw new Error(
      `VIP tier ${vipTierId} not found for ${brand}`
    );
  }

  return tier.name;
}