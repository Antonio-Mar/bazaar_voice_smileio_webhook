# Bazaarvoice → Smile.io Review Rewards Integration

A TypeScript/Node.js integration that receives Bazaarvoice review-status webhooks and awards Smile.io loyalty points based on a customer's VIP tier.

The project is designed for multiple Rocky Brands properties with brand-specific Bazaarvoice credentials, Smile.io credentials, VIP tier names, and reward values.

---

## Overview

For an approved Bazaarvoice review, the integration currently:

1. Receives a Bazaarvoice webhook through a Netlify Function.
2. Normalizes the Bazaarvoice payload into an internal event.
3. Validates the normalized event with Zod.
4. Checks Upstash Redis to determine whether the event has already completed.
5. Acquires a temporary Redis processing lock.
6. Retrieves the review from the Bazaarvoice Conversations API.
7. Reads and decrypts the review's encrypted customer email.
8. Searches Smile.io for the customer.
9. Reads the customer's `vip_status.vip_tier_id`.
10. Resolves that ID to a Smile VIP tier name.
11. Looks up the configured reward for that brand and tier.
12. Creates a Smile.io points transaction.
13. Marks the event completed in Redis after Smile succeeds.
14. Releases the processing lock.

The application is configured to run as a Netlify Function.

---

## Technology

- TypeScript
- Node.js
- Netlify Functions
- Bazaarvoice Webhooks
- Bazaarvoice Conversations API
- Smile.io API
- Upstash Redis
- Zod
- dotenv

---

## Project Structure

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
│   ├── bazaarvoiceConfig.ts
│   ├── brandConfigs.types.ts
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
│   ├── logger.ts
│   ├── processEvent.ts
│   ├── rewardEngine.ts
│   └── various local test utilities
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

## Brand Support

### Fully API-wired brands

The following brands currently have entries in both `smileConfig.ts` and `bazaarvoiceConfig.ts`:

- Rocky
- Georgia Boot
- Durango
- Muck
- Xtratuf

These brands can currently use the full Bazaarvoice → Smile.io processing flow, assuming the appropriate environment variables are configured.

### Partially scaffolded brands

The following brands are present in the event schema, source-client mapping, and reward configuration layer:

- Ranger
- SlipGrips
- Lehigh Outfitters
- Lehigh Safety Shoes

However, they are not currently included in the `Brand` type used by the Smile/Bazaarvoice integrations and do not currently have API credential mappings in `smileConfig.ts` and `bazaarvoiceConfig.ts`.

They should not be considered fully enabled until those integration configs are added.

---

## Bazaarvoice Brand Mapping

Bazaarvoice `sourceClient` values are normalized into the application's internal brand values.

Examples:

```text
rockyboots        → rocky
georgiaboot       → georgia
durangoboot       → durango
muckboot          → muck
xtratuf           → xtratuf
slipgrips         → slipgrips
ranger            → ranger
lehighsafetyshoes → lehighSafetyShoes
lehighoutfitters  → lehighOutfitters
```

---

## Supported Webhook Events

The Bazaarvoice normalizer currently maps:

```text
cgc.review.status.approved.v1 → review.approved
cgc.review.status.rejected.v1 → review.rejected
```

The reward engine also contains logic for:

```text
review.edited
```

but an edited-review Bazaarvoice event is not currently mapped by `bazaarvoice.normalizer.ts`.

---

## Example Bazaarvoice Webhook

The Netlify Function expects a Bazaarvoice webhook payload with fields such as:

```json
{
  "Metadata": {
    "eventType": "cgc.review.status.approved.v1",
    "occurredAt": "2026-08-25T17:59:40.258Z"
  },
  "CurrentState": {
    "id": "305983004",
    "rating": 5,
    "contentLocale": "en_US",
    "sourceClient": "rockyboots",
    "userEmailAddress": "ENCRYPTED_EMAIL",
    "SubjectProduct": {
      "productId": "123456"
    }
  }
}
```

The payload is normalized and validated before processing.

---

## Internal Event

A normalized approved-review event resembles:

```json
{
  "eventType": "review.approved",
  "brand": "rocky",
  "source": "bazaarvoice",
  "reviewId": "305983004",
  "productId": "123456",
  "occurredAt": "2026-08-25T17:59:40.258Z",
  "encryptedEmail": "ENCRYPTED_EMAIL",
  "metadata": {
    "locale": "en_US",
    "rating": 5
  }
}
```

Validation is performed with the Zod schema in:

```text
src/schemas/event.schema.ts
```

---

## Bazaarvoice Review Lookup

The integration does not decrypt the webhook email value directly during processing.

Instead, the review ID is used to query the Bazaarvoice Conversations API:

```text
GET /data/reviews.json
```

with:

```text
ApiVersion=5.4
PassKey=<brand API key>
Filter=Id:<reviewId>
```

The application then reads:

```text
UserEmailAddress
```

from the returned review.

### Important field casing

The webhook uses:

```text
userEmailAddress
```

while the Conversations API response uses:

```text
UserEmailAddress
```

JavaScript field names are case-sensitive.

---

## Bazaarvoice API Availability

A webhook event may arrive before the corresponding review is available through the Conversations API.

The current `getReviewById()` implementation performs one Bazaarvoice API request.

If the API returns no matching review, the request throws an error:

```text
Review not found: <reviewId>
```

The event is not marked complete in Redis, and the temporary processing lock is released.

This allows a later Bazaarvoice webhook retry to attempt the event again.

There is currently no internal retry/backoff loop inside `getReviewById()`.

---

## Customer Email Decryption

Bazaarvoice customer email addresses are decrypted using AES-128-ECB with the brand-specific shared key.

The implementation creates the AES key with:

```ts
const key = Buffer
  .from(secret, "utf8")
  .subarray(0, 16);
```

and decrypts the Base64 value using:

```ts
decipher.update(
  encryptedEmail,
  "base64",
  "utf8"
);
```

Each enabled brand requires its own Bazaarvoice email shared key.

---

## Smile Customer Lookup

After the Bazaarvoice email is decrypted, the integration searches Smile.io using:

```text
GET /customers
```

The request includes:

```text
limit=10
email=<customer email>
include=vip_status
```

This allows the application to access:

```ts
customer.vip_status?.vip_tier_id
```

If no Smile customer is found, processing fails and the event is left retryable.

---

## Smile VIP Tier Lookup

For approved reviews, the customer's Smile VIP tier ID is resolved through:

```text
GET /vip_tiers
```

The integration searches the returned tiers for a matching ID and returns its name.

Example:

```text
vip_tier_id: 12345
      ↓
Gold Buckle
```

That tier name is then passed to the reward engine.

---

## Reward Configuration

Approved-review rewards are configured independently for each brand.

The shared configuration type uses:

```ts
reviewApproved: Record<string, number>;
```

This allows brands to use different Smile VIP tier names.

### Durango

```ts
reviewApproved: {
  "bronze buckle": 50,
  "silver buckle": 75,
  "gold buckle": 100,
}
```

### Rocky

```ts
reviewApproved: {
  bronze: 50,
  silver: 75,
  gold: 100,
}
```

### Georgia Boot

```ts
reviewApproved: {
  apprentice: 50,
  journeyman: 75,
  foreman: 100,
}
```

The reward engine does not hard-code tier names.

---

## Reward Calculation

For approved reviews, the Smile tier name is normalized:

```ts
const tierKey = vipTierName
  .trim()
  .toLowerCase();
```

The reward is then retrieved from the active brand configuration:

```ts
const points =
  config.rewards.reviewApproved[tierKey];
```

Example:

```text
Smile returns:
Gold Buckle

      ↓

Normalized:
gold buckle

      ↓

Durango:
reviewApproved["gold buckle"]

      ↓

100 points
```

If no configured reward exists for the returned tier name, processing throws an error rather than awarding an incorrect value.

---

## Smile Points Transaction

Points are awarded through:

```text
POST /points_transactions
```

with a payload similar to:

```json
{
  "points_transaction": {
    "customer_id": 123456,
    "points_change": 100,
    "description": "BazaarVoice Review",
    "internal_note": "BazaarVoice Review"
  }
}
```

The current processor passes the customer ID and calculated points into `awardSmilePoints()`.

Although each brand configuration contains:

```ts
smile: {
  description: "...",
  internalNote: "..."
}
```

those brand-specific values are not currently passed into `awardSmilePoints()`.

As a result, the current points transaction uses the default:

```text
BazaarVoice Review
```

for both the description and internal note.

---

## Idempotency

Upstash Redis is used to prevent duplicate point awards.

The base event key is:

```text
source:reviewId:eventType
```

Example:

```text
bazaarvoice:305983004:review.approved
```

Two Redis records are used.

### Processing Lock

```text
processing:bazaarvoice:305983004:review.approved
```

The processing lock:

- prevents simultaneous processing of the same event
- uses Redis `NX`
- expires after 5 minutes

### Completed Record

```text
completed:bazaarvoice:305983004:review.approved
```

The completed record:

- is written only after successful processing
- expires after 7 days

The completed key is intentionally not written when processing fails.

---

## Approved Review Processing Flow

```text
Bazaarvoice approved-review webhook
        │
        ▼
Netlify Function
        │
        ▼
Normalize + Zod validation
        │
        ▼
Check completed Redis key
        │
        ├── exists ──► DUPLICATE_SKIPPED
        │
        ▼
Acquire processing lock
        │
        ▼
Bazaarvoice Reviews API
        │
        ▼
Retrieve UserEmailAddress
        │
        ▼
Decrypt email
        │
        ▼
Smile customer lookup
        │
        ▼
Read vip_tier_id
        │
        ▼
Resolve VIP tier name
        │
        ▼
Brand reward configuration
        │
        ▼
Calculate points
        │
        ▼
Smile points transaction
        │
        ▼
Mark completed
        │
        ▼
Release processing lock
```

If any processing step throws an error, the completed key is not created and the processing lock is released.

---

## Logging

The structured application logger supports statuses including:

```text
RECEIVED
VALIDATED
CUSTOMER_FOUND
POINTS_CALCULATED
POINTS_AWARDED
FAILED
DUPLICATE_SKIPPED
```

Example:

```json
{
  "timestamp": "2026-10-14T18:00:00.000Z",
  "reviewId": "305983004",
  "brand": "durango",
  "eventType": "review.approved",
  "rewardPoints": 100,
  "status": "POINTS_AWARDED"
}
```

### Current debugging note

The current processor includes the decrypted `customerEmail` in the `CUSTOMER_FOUND` log entry, and the Smile customer integration logs the full Smile customer-search response.

These debug logs should be removed or sanitized before treating the implementation as production-safe for customer PII.

---

## Environment Variables

### Bazaarvoice

The currently fully wired brands require:

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

### Smile.io

```env
SMILE_API_URL=

SMILE_ROCKY_API_KEY=
SMILE_GEORGIA_API_KEY=
SMILE_DURANGO_API_KEY=
SMILE_MUCK_API_KEY=
SMILE_XTRATUF_API_KEY=
```

### Upstash Redis

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Never commit real environment-variable values or API credentials.

---

## Local Development

Install dependencies:

```bash
npm install
```

Create a local `.env` file containing the required credentials.

The repository currently defines these npm scripts:

```text
npm run validate
npm run normalize
npm run idempotency
npm run reward
npm run webhook-test
npm run bazaarvoice-test
npm run live-idempotency
npm run process-event
npm run decryption-test
npm run vip-test
```

---

## VIP Tier Test

The Smile VIP lookup can be tested with:

```bash
npm run vip-test
```

The utility:

1. Finds a Smile customer by email.
2. Reads the customer's `vip_status.vip_tier_id`.
3. Retrieves Smile VIP tiers.
4. Resolves the matching tier name.

A successful result resembles:

```text
VIP RESULT: {
  vipTierId: 12345,
  vipTierName: "Gold Buckle"
}
```

Use test data rather than hard-coding real customer or employee PII into files committed to the repository.

---

## Decryption Test

Bazaarvoice email lookup and decryption can be tested with:

```bash
npm run decryption-test
```

This is useful for confirming:

- brand API configuration
- review lookup
- encrypted email retrieval
- shared-key configuration
- AES email decryption

---

## Netlify

The project uses:

```toml
[build]
command = "echo 'no build step'"
functions = "netlify/functions"
```

The webhook function is located at:

```text
netlify/functions/bazaarvoice-webhook.ts
```

Only POST requests are accepted.

Non-POST requests return:

```text
405 Method Not Allowed
```

Errors encountered while parsing, normalizing, validating, or processing the webhook currently return HTTP `500`.

---

## Adding a New Brand

To fully enable another brand:

1. Add the brand to the shared integration `Brand` type.
2. Add the brand to `EventSchema`.
3. Add its Bazaarvoice `sourceClient` mapping.
4. Create or update its reward configuration.
5. Add it to `getBrandConfig.ts`.
6. Add its Smile API key mapping to `smileConfig.ts`.
7. Add its Bazaarvoice API key and email shared key to `bazaarvoiceConfig.ts`.
8. Add the required Netlify environment variables.
9. Confirm its exact Smile VIP tier names.
10. Test Bazaarvoice review retrieval and decryption.
11. Test Smile customer lookup.
12. Test Smile VIP tier resolution.
13. Run an end-to-end approved-review test.

---

## Current Limitations / Follow-Up Work

The current repository still has several areas that can be improved:

- Ranger, SlipGrips, Lehigh Outfitters, and Lehigh Safety Shoes are not yet fully wired into the API integration configs.
- Bazaarvoice review retrieval currently has no application-level retry/backoff.
- `review.edited` reward logic exists, but no edited-review Bazaarvoice event is currently mapped.
- Brand-specific Smile transaction descriptions and internal notes exist in configuration but are not currently passed to the Smile transaction client.
- Debug logging currently contains customer PII and should be sanitized.
- Invalid webhook payloads currently result in HTTP `500` rather than a dedicated `400` validation response.
- Automated integration tests are not yet present.
- Dead-letter/replay handling is not implemented.
- Correlation IDs and monitoring could be expanded.

---

## Security

This integration handles customer PII and credentials.

Production deployments should:

- store API keys and shared secrets only in protected environment variables
- keep `.env` files out of source control
- avoid logging decrypted customer email addresses
- avoid logging complete Smile customer records
- avoid hard-coding customer or employee emails in committed test files
- avoid exposing Bazaarvoice shared keys
- avoid exposing Smile API keys
- avoid including credential values in thrown errors
- keep credentials separated by brand

---

## Summary

The current implementation provides an end-to-end Bazaarvoice → Smile.io approved-review reward flow for the five fully configured brands:

```text
Rocky
Georgia Boot
Durango
Muck
Xtratuf
```

It currently supports:

- Bazaarvoice review webhooks
- webhook normalization and Zod validation
- encrypted Bazaarvoice email retrieval and decryption
- Smile customer lookup
- Smile VIP tier lookup
- brand-specific VIP reward values
- Smile points transactions
- Redis idempotency
- temporary concurrent-processing locks
- structured event logging
- Netlify serverless execution

The reward architecture is intentionally configuration-driven so different brands can use different Smile VIP tier names without changing the core reward engine.