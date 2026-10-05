# Bazaarvoice → Smile.io Review Rewards Integration

A multi-brand TypeScript/Node.js integration that listens for Bazaarvoice review events and awards Smile.io loyalty points based on the customer's VIP tier.

The integration is designed to support multiple Rocky Brands properties with brand-specific Bazaarvoice credentials, Smile.io credentials, reward values, and configuration.

---

## Overview

This service receives Bazaarvoice webhook events when a product review changes status.

For approved reviews, the integration:

1. Receives the Bazaarvoice webhook.
2. Normalizes the Bazaarvoice payload into an internal event format.
3. Checks Redis to determine whether the review event has already been processed.
4. Acquires a temporary processing lock to prevent simultaneous duplicate processing.
5. Looks up the review through the Bazaarvoice Conversations API.
6. Retrieves and decrypts the customer's encrypted email address.
7. Searches Smile.io for the customer using the decrypted email.
8. Determines the customer's Smile VIP tier.
9. Calculates the review reward using the brand configuration and VIP tier.
10. Awards the appropriate number of Smile.io points.
11. Marks the event as successfully processed in Redis.
12. Releases the temporary processing lock.

The integration is currently deployed as a Netlify serverless function.

---

# Technology

- TypeScript
- Node.js
- Netlify Functions
- Bazaarvoice Conversations API
- Bazaarvoice Webhooks
- Smile.io API
- Upstash Redis
- Zod
- dotenv

---

# Project Structure

```text
src/
├── config/
│   ├── brands/
│   │   ├── rocky.ts
│   │   ├── georgia.ts
│   │   ├── durango.ts
│   │   ├── muck.ts
│   │   ├── xtratuf.ts
│   │   ├── ranger.ts
│   │   ├── slipgrips.ts
│   │   ├── lehighOutfitters.ts
│   │   └── lehighSafetyShoes.ts
│   │
│   ├── bazaarvoiceConfig.ts
│   ├── brandConfig.types.ts
│   ├── getBrandConfig.ts
│   └── smileConfig.ts
│
├── integrations/
│   ├── bazaarvoice.client.ts
│   ├── bazaarvoice.customer.ts
│   ├── bazaarvoiceEmail.ts
│   ├── redis.ts
│   ├── smile.client.ts
│   ├── smile.customer.ts
│   └── smile.vip.ts
│
├── library/
│   ├── eventKey.ts
│   ├── idempotency.ts
│   ├── processEvent.ts
│   ├── rewardEngine.ts
│   ├── testDecrypt.ts
│   └── testVip.ts
│
├── logging/
│   └── logger.ts
│
├── normalizers/
│   └── bazaarvoice.normalizer.ts
│
└── schemas/
    └── event.schema.ts

netlify/
└── functions/
    └── bazaarvoice-webhook.ts
```

---

# Supported Brands

The integration currently supports brand-specific configuration for:

- Rocky
- Georgia Boot
- Durango
- Muck
- Xtratuf
- Ranger
- SlipGrips
- Lehigh Outfitters
- Lehigh Safety Shoes

Bazaarvoice `sourceClient` values are normalized into internal brand names before the event is processed.

Example:

```text
rockyboots → rocky
georgiaboot → georgia
durangoboot → durango
muckboot → muck
xtratuf → xtratuf
```

---

# Bazaarvoice Webhook

The Netlify function receives Bazaarvoice webhook events such as:

```json
{
  "Metadata": {
    "eventId": "example-event-id",
    "eventType": "cgc.review.status.approved.v1",
    "subject": "review",
    "occurredAt": "2026-08-25T17:59:40.258Z"
  },
  "CurrentState": {
    "rating": 5,
    "sourceClient": "rockyboots",
    "contentLocale": "en_US",
    "id": "305983004",
    "moderationStatus": "APPROVED",
    "userEmailAddress": "ENCRYPTED_EMAIL",
    "SubjectProduct": {
      "productId": "product::123456"
    },
    "Contributor": {
      "authorId": "example-author-id"
    }
  }
}
```

The webhook payload is normalized before being sent through the rest of the application.

---

# Internal Event Format

Bazaarvoice events are transformed into a consistent internal event structure.

Example:

```json
{
  "eventType": "review.approved",
  "brand": "rocky",
  "source": "bazaarvoice",
  "reviewId": "305983004",
  "productId": "product::123456",
  "occurredAt": "2026-08-25T17:59:40.258Z",
  "encryptedEmail": "ENCRYPTED_EMAIL",
  "metadata": {
    "locale": "en_US",
    "rating": 5
  }
}
```

The event is validated with Zod before processing.

---

# Event Mapping

Bazaarvoice webhook event types are converted to internal event names.

```text
cgc.review.status.approved.v1 → review.approved
cgc.review.status.rejected.v1 → review.rejected
```

Additional event mappings can be added to the Bazaarvoice normalizer as needed.

---

# Bazaarvoice Customer Email

Bazaarvoice customer email addresses are encrypted.

Rather than decrypting the email value directly from the webhook, the integration retrieves the review through the Bazaarvoice Conversations API.

```text
GET /data/reviews.json
```

The API response provides:

```json
{
  "UserEmailAddress": "ENCRYPTED_EMAIL"
}
```

The API uses `UserEmailAddress` with a capital `U`, while Bazaarvoice webhook payloads use `userEmailAddress`.

These values should not be treated as interchangeable.

---

# Email Decryption

Encrypted Bazaarvoice email addresses are decrypted using AES-128-ECB.

The correct brand-specific Bazaarvoice shared key is selected before decryption.

```ts
const key = Buffer
  .from(secret, "utf8")
  .subarray(0, 16);
```

The encrypted email is Base64 decoded during decryption.

```ts
decipher.update(
  encryptedEmail,
  "base64",
  "utf8"
);
```

Do not log decrypted customer email addresses unless needed for temporary debugging.

---

# Bazaarvoice API Propagation

A Bazaarvoice webhook can arrive before the same review is available through the Conversations Reviews API.

For example:

```text
Webhook receives approved review
        ↓
GET /data/reviews.json
        ↓
HTTP 200
TotalResults: 0
```

The integration performs a short retry when retrieving a review.

If the review is still unavailable, processing fails without marking the event complete.

Bazaarvoice can then retry delivery later.

This behavior is important because a review should never be permanently marked processed before all required downstream actions succeed.

---

# Smile.io Customer Lookup

After decrypting the customer email, the integration searches Smile.io.

```text
GET /customers
```

The request includes:

```text
include=vip_status
```

This allows the customer response to include the customer's VIP tier information.

Example:

```json
{
  "id": 123456,
  "email": "customer@example.com",
  "vip_status": {
    "vip_tier_id": 789
  }
}
```

---

# Smile VIP Tier Lookup

The customer's `vip_tier_id` is resolved using the Smile VIP tiers endpoint.

```text
GET /vip_tiers
```

The integration matches the customer's VIP tier ID to the tier name.

Example:

```text
vip_tier_id: 789
        ↓
Gold Buckle
```

The tier name is then passed to the reward engine.

---

# Reward Configuration

Reward values are controlled at the brand level.

This allows each brand to use different VIP tier names and different point values without changing application logic.

Example Durango configuration:

```ts
export const durangoConfig = {
  brand: "durango",

  rewards: {
    reviewApproved: {
      "bronze buckle": 50,
      "silver buckle": 75,
      "gold buckle": 100,
    },

    reviewEdited: 10,
  },

  smile: {
    description: "Durango Review",
    internalNote: "BV Review Reward",
  },
};
```

Another brand can use completely different tier names:

```ts
reviewApproved: {
  member: 50,
  premium: 75,
  elite: 100,
}
```

No reward-engine changes are required.

---

# Reward Engine

The reward engine retrieves the appropriate brand configuration.

For approved reviews, the Smile VIP tier name is normalized:

```ts
const tierKey = vipTierName
  .trim()
  .toLowerCase();
```

The configured reward is then retrieved:

```ts
const points =
  config.rewards.reviewApproved[tierKey];
```

If a Smile VIP tier exists but no reward is configured for it, processing fails instead of awarding an incorrect number of points.

Example:

```text
Smile tier:
Gold Buckle

        ↓

Normalized:
gold buckle

        ↓

Durango config:
reviewApproved["gold buckle"]

        ↓

100 points
```

---

# Idempotency

Upstash Redis prevents the same review event from awarding points more than once.

The event key is generated using:

```text
source + reviewId + eventType
```

Example:

```text
bazaarvoice:305983004:review.approved
```

Two Redis keys are used.

## Processing Lock

```text
processing:bazaarvoice:305983004:review.approved
```

The processing lock prevents multiple webhook deliveries from processing the same event simultaneously.

The lock has a short TTL.

## Completed Event

```text
completed:bazaarvoice:305983004:review.approved
```

The completed key is written only after Smile successfully awards the points.

This prevents the following failure:

```text
Mark processed
      ↓
Smile fails
      ↓
Bazaarvoice retries
      ↓
Event incorrectly skipped
```

Instead, the current flow is:

```text
Acquire processing lock
      ↓
Process event
      ↓
Award Smile points
      ↓
Mark completed
      ↓
Release processing lock
```

If processing fails:

```text
Acquire processing lock
      ↓
Failure
      ↓
Do NOT mark completed
      ↓
Release processing lock
      ↓
Allow future retry
```

---

# Logging

The application uses structured event logging.

Typical statuses include:

```text
RECEIVED
POINTS_CALCULATED
CUSTOMER_FOUND
POINTS_AWARDED
FAILED
DUPLICATE_SKIPPED
```

Example:

```json
{
  "timestamp": "2026-08-25T17:59:40.418Z",
  "reviewId": "305983004",
  "brand": "rocky",
  "eventType": "review.approved",
  "rewardPoints": 100,
  "status": "POINTS_AWARDED"
}
```

Sensitive customer information should not be included in permanent logs.

---

# Environment Variables

The application requires Bazaarvoice, Smile.io, Redis, and API URL configuration.

Never commit `.env` files or API credentials to source control.

## Bazaarvoice

```env
BV_API_URL=

BV_API_KEY_ROCKY=
BV_EMAIL_SHARED_KEY_ROCKY=

BV_API_KEY_GEORGIA=
BV_EMAIL_SHARED_KEY_GEORGIA=

BV_API_KEY_DURANGO=
BV_EMAIL_SHARED_KEY_DURANGO=

BV_API_KEY_MUCK=
BV_EMAIL_SHARED_KEY_MUCK=

BV_API_KEY_XTRATUF=
BV_EMAIL_SHARED_KEY_XTRATUF=
```

Additional brand variables should follow the same naming convention.

## Smile.io

```env
SMILE_API_URL=

SMILE_ROCKY_API_KEY=
SMILE_GEORGIA_API_KEY=
SMILE_DURANGO_API_KEY=
SMILE_MUCK_API_KEY=
SMILE_XTRATUF_API_KEY=
```

Additional brand API keys should follow the same pattern.

## Redis / Upstash

Configure the appropriate Upstash Redis credentials required by `src/integrations/redis.ts`.

Example:

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Use the exact environment variable names expected by the Redis client implementation.

---

# Local Development

Install dependencies:

```bash
npm install
```

Create a local `.env` file containing the required development credentials.

Run TypeScript utilities using the configured npm scripts.

---

# Local Decryption Test

A review can be retrieved and decrypted locally using:

```bash
npm run decryption-test
```

The test:

1. Selects a brand.
2. Retrieves the review through Bazaarvoice.
3. Gets the encrypted `UserEmailAddress`.
4. Selects the appropriate brand shared key.
5. Decrypts the email locally.

This is useful when diagnosing Bazaarvoice encryption or API configuration issues.

---

# VIP Tier Test

The Smile VIP integration can be tested independently.

```bash
npm run vip-test
```

The test should:

1. Search Smile for a known customer.
2. Read `vip_status.vip_tier_id`.
3. Retrieve the configured VIP tiers.
4. Resolve the tier ID to its tier name.

Example output:

```text
CUSTOMER:
{
  id: 123456,
  vipStatus: {
    vip_tier_id: 789
  }
}

VIP RESULT:
{
  vipTierId: 789,
  vipTierName: "Gold Buckle"
}
```

---

# End-to-End Processing Flow

```text
Bazaarvoice
Review Approved
      │
      ▼
Netlify Webhook
      │
      ▼
Validate Payload
      │
      ▼
Normalize Event
      │
      ▼
Check Completed Redis Key
      │
      ├──── Already completed
      │          │
      │          ▼
      │    DUPLICATE_SKIPPED
      │
      ▼
Acquire Processing Lock
      │
      ▼
Bazaarvoice Reviews API
      │
      ▼
Retrieve UserEmailAddress
      │
      ▼
Decrypt Customer Email
      │
      ▼
Smile Customer Search
      │
      ▼
Read VIP Tier ID
      │
      ▼
Resolve VIP Tier Name
      │
      ▼
Brand Reward Config
      │
      ▼
Calculate Reward
      │
      ▼
Award Smile Points
      │
      ▼
Mark Redis Event Completed
      │
      ▼
Release Lock
```

---

# Error Handling

Events are not marked complete when processing fails.

Common failure scenarios include:

- Invalid Bazaarvoice webhook payload
- Unsupported Bazaarvoice brand
- Missing API credentials
- Bazaarvoice review not yet available
- Bazaarvoice API error
- Email decryption failure
- Smile customer not found
- Smile VIP tier not found
- VIP reward not configured for a brand
- Smile points transaction failure

When an error occurs:

```text
FAILED
```

is logged and the processing lock is released.

This allows Bazaarvoice to retry the webhook.

---

# Security

The integration handles customer PII and API credentials.

Important security requirements:

- Never commit `.env` files.
- Keep API keys in Netlify environment variables.
- Keep Redis credentials in protected environment variables.
- Do not log Bazaarvoice shared secrets.
- Do not log Smile API keys.
- Avoid permanently logging decrypted customer email addresses.
- Do not include API credentials in error messages.
- Keep brand credentials separated.

---

# Adding a New Brand

To add another brand:

1. Add the brand to the internal brand type/schema.
2. Add the Bazaarvoice `sourceClient` mapping.
3. Add the brand's Bazaarvoice API key.
4. Add the brand's Bazaarvoice email shared key.
5. Add the brand's Smile API key.
6. Create a brand configuration file.
7. Add the brand config to `getBrandConfig.ts`.
8. Configure VIP tier names and reward values.
9. Add the brand to the appropriate Smile and Bazaarvoice configuration maps.
10. Test Bazaarvoice review retrieval.
11. Test email decryption.
12. Test Smile customer lookup.
13. Test VIP tier resolution.
14. Complete an end-to-end review reward test.

Example reward configuration:

```ts
rewards: {
  reviewApproved: {
    "tier one": 50,
    "tier two": 75,
    "tier three": 100,
  },

  reviewEdited: 10,
}
```

---

# Important Implementation Notes

### Bazaarvoice Email Field Casing

Webhook:

```text
userEmailAddress
```

Reviews API:

```text
UserEmailAddress
```

JavaScript is case-sensitive, so these must be handled separately.

### Do Not Mark Events Complete Early

The Redis completed key must only be written after the Smile points transaction succeeds.

### Bazaarvoice Reviews API May Lag Behind Webhooks

Receiving a Bazaarvoice webhook does not guarantee that the same review is immediately available through `/data/reviews.json`.

The event should remain retryable if the API does not yet return the review.

### VIP Tier Names Are Config Driven

Do not hard-code Bronze, Silver, Gold, or other tier names in the reward engine.

Each brand config should contain the exact normalized Smile tier names used by that brand.

---

# Future Improvements

Potential future improvements include:

- Dead-letter queue for events that exceed retry limits
- Additional structured monitoring and alerting
- Improved correlation IDs across Bazaarvoice, Smile, and Redis
- Longer-term failed-event storage
- Administrative replay capability
- Automated integration tests
- Brand configuration validation at startup
- Centralized secrets management
- Additional Bazaarvoice event support
- Metrics/dashboard for awarded points and failures

---

# Summary

This integration provides a scalable multi-brand bridge between Bazaarvoice and Smile.io.

It supports:

- Bazaarvoice review webhooks
- Multi-brand credentials
- Encrypted customer email handling
- Smile customer lookup
- Smile VIP tier rewards
- Brand-specific reward configuration
- Redis-based idempotency
- Concurrent processing protection
- Structured logging
- Retry-safe failure handling
- Netlify serverless deployment

The architecture keeps brand-specific business rules inside configuration files while keeping the core processing pipeline reusable across all supported brands.