export type BrandConfig = {
  brand: string;

  rewards: {
    reviewApproved: Record<string, number>;
    reviewEdited: number;
  };

  smile: {
    description: string;
    internalNote: string;
  };
};