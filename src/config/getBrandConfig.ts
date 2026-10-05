import type { BrandConfig } from "./brandConfig.types";

import { rockyConfig } from "./brands/rocky";
import { georgiaConfig } from "./brands/georgia";
import { durangoConfig } from "./brands/durango";
import { muckConfig } from "./brands/muck";
import { xtratufConfig } from "./brands/xtratuf";
import { rangerConfig } from "./brands/ranger";
import { slipgripConfig } from "./brands/slipgrips";
import { lehighOutfittersConfig } from "./brands/lehighOutfitters";
import { lehighSafetyShoesConfig } from "./brands/lehighSafetyShoes";

const configs: Record<string, BrandConfig> = {
  georgia: georgiaConfig,
  xtratuf: xtratufConfig,
  slipgrips: slipgripConfig,
  rocky: rockyConfig,
  ranger: rangerConfig,
  durango: durangoConfig,
  muck: muckConfig,
  lehighOutfitters: lehighOutfittersConfig,
  lehighSafetyShoes: lehighSafetyShoesConfig,
};

export function getBrandConfig(
  brand: string
): BrandConfig {
  const config = configs[brand];

  if (!config) {
    throw new Error(`Unknown brand: ${brand}`);
  }

  return config;
}