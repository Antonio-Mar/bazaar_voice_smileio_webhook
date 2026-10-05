import type { BrandConfig } from "../brandConfigs.types";


export const georgiaConfig: BrandConfig = {
  brand: "georgia",

  rewards: {
    reviewApproved: {
      bronze: 50,
      silver: 75,
      gold: 100,
    },

    reviewEdited: 10,
  },

  smile: {
    description: "Georgia Review",
    internalNote: "BV Review Reward",
  },
};
