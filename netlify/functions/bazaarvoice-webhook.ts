import { processEvent } from "../../src/library/processEvent";
import { transformToInternalEvent } from "../../src/normalizers/bazaarvoice.normalizer";

export const handler = async (event: any) => {
  console.log("=== Bazaarvoice webhook received ===");

  console.log({
    timestamp: new Date().toISOString(),
    method: event.httpMethod,
    userAgent: event.headers?.["user-agent"],
  });

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        message: "Method Not Allowed",
      }),
    };
  }

  try {
    if (!event.body) {
      throw new Error("Missing webhook body");
    }

    const body = JSON.parse(event.body);

    console.log(
      "Raw payload:",
      JSON.stringify(body, null, 2)
    );

    const normalizedEvent =
      transformToInternalEvent(body);

    console.log("Normalized event:", {
      eventType: normalizedEvent.eventType,
      brand: normalizedEvent.brand,
      reviewId: normalizedEvent.reviewId,
    });

    const result =
      await processEvent(normalizedEvent);

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