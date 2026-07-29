import crypto from "crypto";
import { getBazaarvoiceConfig } from "../config/bazaarvoiceConfig";
import type { Brand } from "../config/smileConfig";

export function decryptEmail(encryptedEmail: string, brand: Brand): string {
  const config = getBazaarvoiceConfig(brand);

  const secret = config.emailSharedKey;

  console.log("BV DECRYPT DEBUG", {
  brand,
  encryptedEmailLength: encryptedEmail.length,
  secretLength: secret?.length,
  keyPreview: secret?.slice(0, 5),
});

  if (!secret) {
    throw new Error(`Missing Bazaarvoice email shared key for ${brand}`);
  }

  const key = Buffer.from(secret, "hex");

console.log("KEY BYTE LENGTH", key.length);

console.log("BV CONFIG", {
  brand,
  keyName:
    brand === "rocky"
      ? "BV_EMAIL_SHARED_KEY_ROCKY"
      : "other"
});

console.log(
  "KEY SHA1",
  crypto
    .createHash("sha1")
    .update(secret)
    .digest("hex")
);

  const decipher = crypto.createDecipheriv("aes-128-ecb", key, null);

  decipher.setAutoPadding(true);

  let decrypted = decipher.update(encryptedEmail, "base64", "utf8");

  decrypted += decipher.final("utf8");

  return decrypted;
}
