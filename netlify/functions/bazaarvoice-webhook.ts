import { processEvent } from "../../src/library/processEvent";
import { transformToInternalEvent } from "../../src/normalizers/bazaarvoice.normalizer";

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body || "{}");

    // ✅ normalize FIRST
    const normalizedEvent = transformToInternalEvent(body);

    // ✅ THEN process
    const result = await processEvent(normalizedEvent);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
    };
  }
};