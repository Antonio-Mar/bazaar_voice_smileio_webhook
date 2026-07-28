export type Brand = "georgia" | "durango" | "muck" | "xtratuf" | "rocky";


type BazaarvoiceBrandConfig = {
  apiKey: string;
  apiUrl: string;
  emailSharedKey: string;
};

export function getBazaarvoiceConfig(
  brand: Brand
) {
  const configs = {
    rocky: {
      apiKey: process.env.BV_ROCKY_API_KEY!,
      apiUrl: process.env.BV_ROCKY_API_URL!,
      emailSharedKey:
        process.env.BV_ROCKY_EMAIL_SHARED_KEY!,
    },

    georgia: {
      apiKey: process.env.BV_GEORGIA_API_KEY!,
      apiUrl: process.env.BV_GEORGIA_API_URL!,
      emailSharedKey:
        process.env.BV_GEORGIA_EMAIL_SHARED_KEY!,
    },

    durango: {
      apiKey: process.env.BV_DURANGO_API_KEY!,
      apiUrl: process.env.BV_DURANGO_API_URL!,
      emailSharedKey:
        process.env.BV_DURANGO_EMAIL_SHARED_KEY!,
    },

    muck: {
      apiKey: process.env.BV_MUCK_API_KEY!,
      apiUrl: process.env.BV_MUCK_API_URL!,
      emailSharedKey:
        process.env.BV_MUCK_EMAIL_SHARED_KEY!,
    },

    xtratuf: {
      apiKey: process.env.BV_XTRATUF_API_KEY!,
      apiUrl: process.env.BV_XTRATUF_API_URL!,
      emailSharedKey:
        process.env.BV_XTRATUF_EMAIL_SHARED_KEY!,
    },
  };

  return configs[brand];
}