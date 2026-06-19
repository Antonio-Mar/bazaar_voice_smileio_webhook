import type {
  Handler,
  HandlerEvent,
  HandlerResponse
} from "@netlify/functions";

import { transformToInternalEvent } from "../../src/normalizers/bazaarvoice.normalizer";
import { processEvent } from "../../src/library/processEvent";

export const handler: Handler = async (
  event: HandlerEvent
): Promise<HandlerResponse> => {
  try {
    const body = JSON.parse(event.body || "{}");

    const internalEvent =
      transformToInternalEvent(body);

    const result =
      await processEvent(internalEvent);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        result,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      }),
    };
  }
};