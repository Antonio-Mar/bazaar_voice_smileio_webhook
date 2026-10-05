import type { BrandConfig } from "../brandConfigs.types";

export const durangoConfig: BrandConfig = {
  brand: "durango",

  rewards: {
    reviewApproved: {
      "bronze buckle": 50,
      "silver buckle": 75,
      "gold buckle": 100,
    },

    reviewEdited: 10,
  },

  smile: {
    description: "Durango Review",
    internalNote: "BV Review Reward",
  },
};