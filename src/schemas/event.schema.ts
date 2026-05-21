import { z } from "zod";

export const EventSchema = z.object({
  eventType: z.string(),
  brand: z.string(),
  source: z.string(),
  reviewId: z.string(),
  customerEmail: z.string().email(),
  productId: z.string(),
  occurredAt: z.string().datetime(),
  metadata: z.object({
    locale: z.string(),
    rating: z.number().min(1).max(5),
  }).optional(),
});

export type EventPayload = z.infer<typeof EventSchema>;