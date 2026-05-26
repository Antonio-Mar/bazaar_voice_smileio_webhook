import { transformToInternalEvent } from "../normalizers/bazaarvoice.normalizer";
import { processEvent } from "../library/processEvent";

export async function handleBazaarvoiceWebhook(rawPayload: any) {
  try {
    // 1. Normalize
    const event = transformToInternalEvent(rawPayload);

    // 2. Process full pipeline
    const result = await processEvent(event);

    return {
      success: true,
      result,
    };
  } catch (err: any) {
    console.error("Webhook failed:", err.message);

    return {
      success: false,
      error: err.message,
    };
  }
}