import { EventSchema, type EventPayload } from "../schemas/event.schema";

type BazaarvoicePayload = {
  Metadata: {
    eventType: string;
    occurredAt: string;
  };
  CurrentState: {
    id: string;
    rating: number;
    contentLocale: string;
    sourceClient: string;
    userEmailAddress?: string;
    SubjectProduct: {
      productId: string;
    };
  };
};

export function transformToInternalEvent(
  payload: BazaarvoicePayload,
): EventPayload {
  const normalizedEvent = {
    eventType: mapEventType(payload.Metadata.eventType),
    brand: mapBrand(payload.CurrentState.sourceClient),
    source: "bazaarvoice",
    reviewId: payload.CurrentState.id,
    productId: payload.CurrentState.SubjectProduct.productId,
    occurredAt: payload.Metadata.occurredAt,
    metadata: {
      locale: payload.CurrentState.contentLocale,
      rating: payload.CurrentState.rating,
    },
  };

  return EventSchema.parse(normalizedEvent);
}

function mapEventType(event: string): string {
  const eventMap: Record<string, string> = {
    "cgc.review.status.approved.v1": "review.approved",
    "cgc.review.status.rejected.v1": "review.rejected",
  };

  const mapped = eventMap[event];

  if (!mapped) {
    throw new Error(`Unsupported Bazaarvoice event: ${event}`);
  }

  return mapped;
}

function mapBrand(sourceClient: string): string {
  const brands: Record<string, string> = {
    durangoboot: "durango",
    rockyboots: "rocky",
    georgiaboot: "georgia",
    muckboot: "muck",
    xtratuf: "xtratuf",
    slipgrips: "slipgrips",
    ranger: "ranger",
    lehighSafetyShoes: "lehighSafetyShoes",
    lehighOutfitters: "lehighOutfitters",
  };

  const brand = brands[sourceClient];

  if (!brand) {
    throw new Error(`Unsupported Bazaarvoice sourceClient: ${sourceClient}`);
  }

  return brand;
}
