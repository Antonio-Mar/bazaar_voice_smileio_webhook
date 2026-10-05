import "dotenv/config";

import { getSmileCustomerByEmail } from "../integrations/smile.customer";
import { getSmileVipTierName } from "../integrations/smile.vip";
import type { Brand } from "../config/smileConfig";

async function run() {
  const brand: Brand = "durango";

  const email = "william.reichle@rockybrands.com";

  const customer =
    await getSmileCustomerByEmail(
      email,
      brand
    );

  console.log("CUSTOMER:", {
    id: customer.id,
    email: customer.email,
    vipStatus: customer.vip_status,
  });

  const vipTierId =
    customer.vip_status?.vip_tier_id;

  if (vipTierId == null) {
    throw new Error(
      `Customer ${customer.id} has no VIP tier`
    );
  }

  const vipTierName =
    await getSmileVipTierName(
      brand,
      vipTierId
    );

  console.log("VIP RESULT:", {
    vipTierId,
    vipTierName,
  });
}

run();