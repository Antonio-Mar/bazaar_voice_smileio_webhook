export function createEventKey(
  source: string,
  reviewId: string,
  eventType: string
): string {
  return `${source}:${reviewId}:${eventType}`;
}