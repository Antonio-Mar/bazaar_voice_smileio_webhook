export type LogEntry = {
  timestamp: string;
  reviewId: string;
  customerEmail: string;
  brand: string;
  eventType: string;
  rewardPoints?: number;
  status:
    | "RECEIVED"
    | "VALIDATED"
    | "CUSTOMER_FOUND"
    | "POINTS_CALCULATED"
    | "POINTS_AWARDED"
    | "FAILED"
    | "DUPLICATE_SKIPPED";
};

export function logEvent(entry: LogEntry) {
  console.log(JSON.stringify(entry));
}