export type Brand = "georgia" | "durango" | "muck" | "xtratuf" | "rocky";

type SmileBrandConfig = {
    apiKey: string;
};

export function getSmileConfig(brand: Brand) {
  const configs = {
    rocky: {
      apiKey: process.env.SMILE_ROCKY_API_KEY,
    },
    georgia: {
      apiKey: process.env.SMILE_GEORGIA_API_KEY,
    },
    durango: {
      apiKey: process.env.SMILE_DURANGO_API_KEY,
    },
    muck: {
      apiKey: process.env.SMILE_MUCK_API_KEY,
    },
    xtratuf: {
      apiKey: process.env.SMILE_XTRATUF_API_KEY,
    },
  };

  return configs[brand];
}