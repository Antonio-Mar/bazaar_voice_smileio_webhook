import { handleBazaarvoiceWebhook } from "../webhooks/bazaarVoice";
import "dotenv/config";
import "./bootstrap"

const mockPayload = {
  event: "review_approved",
  brand: "brandA",
  review: {
    id: "rev_123",
    productId: "sku_987",
    rating: 5,
    locale: "en_US",
    createdAt: "2026-05-21T16:00:00Z",
  },
  customer: {
    email: "test@example.com",
  },
};

async function run() {
  const result = await handleBazaarvoiceWebhook(mockPayload);
  console.log(JSON.stringify(result, null, 2));
}

run();