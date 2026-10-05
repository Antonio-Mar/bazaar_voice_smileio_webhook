import type { BrandConfig } from "../brandConfigs.types";

export const rockyConfig: BrandConfig = {
  brand: "rocky",

  rewards: {
    reviewApproved: {
      bronze: 50,
      silver: 75,
      gold: 100,
    },

    reviewEdited: 10,
  },

  smile: {
    description: "Rocky Review",
    internalNote: "BV Review Reward",
  },
};