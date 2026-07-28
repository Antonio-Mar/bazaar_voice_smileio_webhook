import type { Brand } from "./smileConfig";

type BazaarvoiceConfig = {
  apiKey: string;
  emailSharedKey: string;
  apiUrl: string;
};

export function getBazaarvoiceConfig(
  brand: Brand
): BazaarvoiceConfig {
  const configs = {
    rocky: {
      apiKey: process.env.BV_API_KEY_ROCKY!,
      emailSharedKey:
        process.env.BV_EMAIL_SHARED_KEY_ROCKY!,
      apiUrl: process.env.BV_API_URL!,
    },

    georgia: {
      apiKey: process.env.BV_API_KEY_GEORGIA!,
      emailSharedKey:
        process.env.BV_EMAIL_SHARED_KEY_GEORGIA!,
      apiUrl: process.env.BV_API_URL!,
    },

    durango: {
      apiKey: process.env.BV_API_KEY_DURANGO!,
      emailSharedKey:
        process.env.BV_EMAIL_SHARED_KEY_DURANGO!,
      apiUrl: process.env.BV_API_URL!,
    },

    muck: {
      apiKey: process.env.BV_API_KEY_MUCK!,
      emailSharedKey:
        process.env.BV_EMAIL_SHARED_KEY_MUCK!,
      apiUrl: process.env.BV_API_URL!,
    },

    xtratuf: {
      apiKey: process.env.BV_API_KEY_XTRATUF!,
      emailSharedKey:
        process.env.BV_EMAIL_SHARED_KEY_XTRATUF!,
      apiUrl: process.env.BV_API_URL!,
    },
  };

  console.log("Bazaarvoice config check:", {
    brand,
    apiKeyExists: !!configs[brand].apiKey,
    emailKeyExists: !!configs[brand].emailSharedKey,
    apiUrlExists: !!configs[brand].apiUrl,
  });

  return configs[brand];
}