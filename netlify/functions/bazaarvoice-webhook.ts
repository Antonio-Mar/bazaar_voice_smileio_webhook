import { processEvent } from "../../src/library/processEvent";
import { transformToInternalEvent } from "../../src/normalizers/bazaarvoice.normalizer";

export const handler = async (event: any) => {
  console.log("=== Bazaarvoice webhook received ===");

  console.log({
    timestamp: new Date().toISOString(),
    method: event.httpMethod,
    userAgent: event.headers?.["user-agent"],
  });

  console.log("RAW BODY:", event.body);

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
      "PARSED PAYLOAD:",
      JSON.stringify(body, null, 2)
    );

    const normalizedEvent =
      transformToInternalEvent(body);

    console.log(
      "NORMALIZED EVENT:",
      JSON.stringify(normalizedEvent, null, 2)
    );

    const result =
      await processEvent(normalizedEvent);

    console.log(
      "PROCESSING RESULT:",
      JSON.stringify(result, null, 2)
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error("WEBHOOK FAILED:", err);

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