import type { BrandConfig } from "../brandConfigs.types";


export const georgiaConfig: BrandConfig = {
  brand: "georgia",

  rewards: {
    reviewApproved: {
      apprentice: 50,
      journeyman: 75,
      foreman: 100,
    },

    reviewEdited: 10,
  },

  smile: {
    description: "Georgia Review",
    internalNote: "BV Review Reward",
  },
};
