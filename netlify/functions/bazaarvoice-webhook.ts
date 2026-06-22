import { processEvent } from "../../src/library/processEvent";

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body || "{}");

    const result = await processEvent(body);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          err instanceof Error ? err.message : "Unknown error",
      }),
    };
  }
};