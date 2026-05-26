export async function awardSmilePoints(
  customerId: string,
  points: number
) {
  console.log("Awarding Smile points:", {
    customerId,
    points,
  });

  return {
    success: true,
    customerId,
    points,
  };
}