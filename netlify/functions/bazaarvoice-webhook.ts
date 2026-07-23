import { processEvent } from "../../src/library/processEvent";
import { transformToInternalEvent } from "../../src/normalizers/bazaarvoice.normalizer";

export const handler = async (event: any) => {
  console.log("=== Bazaarvoice webhook received ===");
  console.log({
    timestamp: new Date().toISOString(),
    method: event.httpMethod,
    userAgent: event.headers?.["user-agent"],
  });

  try {
    const body = JSON.parse(event.body || "{}");

    console.log("Incoming payload:", {
      event: body.event,
      brand: body.brand,
      reviewId: body.review?.id,
    });

    // normalize FIRST
    const normalizedEvent = transformToInternalEvent(body);

    console.log("Normalized event:", {
      eventType: normalizedEvent.eventType,
      brand: normalizedEvent.brand,
      reviewId: normalizedEvent.reviewId,
    });

    // THEN process
    const result = await processEvent(normalizedEvent);

    console.log("Processing result:", result);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };

  } catch (err) {
    console.error("Webhook failed:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          err instanceof Error
            ? err.message
            : "Unknown error",
      }),
    };
  }
};