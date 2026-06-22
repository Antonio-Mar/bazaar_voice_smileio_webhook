import { EventSchema, type EventPayload } from "../schemas/event.schema";

type BazaarvoicePayload = {
  event: string;
  brand: string;
  review: {
    id: string;
    productId: string;
    rating: number;
    locale: string;
    createdAt: string;
  };
  customer: {
    email: string;
  };
};

export function transformToInternalEvent(
  payload: BazaarvoicePayload
): EventPayload {
  const normalizedEvent = {
    eventType: mapEventType(payload.event),
    brand: payload.brand.toLowerCase(),
    source: "bazaarvoice",
    reviewId: payload.review.id,
    customerEmail: payload.customer.email,
    productId: payload.review.productId,
    occurredAt: payload.review.createdAt,
    metadata: {
      locale: payload.review.locale,
      rating: payload.review.rating,
    },
  };

  return EventSchema.parse(normalizedEvent);
}

function mapEventType(event: string): string {
  const eventMap: Record<string, string> = {
    review_approved: "review.approved",
    review_rejected: "review.rejected",
    review_edited: "review.edited",
  };

  const mapped = eventMap[event];

  if (!mapped) {
    throw new Error(`Unsupported Bazaarvoice event: ${event}`);
  }

  return mapped;
}