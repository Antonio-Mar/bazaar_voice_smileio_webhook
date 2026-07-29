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

  const key = Buffer.from(secret, "utf8").subarray(0, 16);

  console.log({
 rawKeyLength: secret.length,
 aesKey: Buffer.from(secret, "utf8")
   .subarray(0,16)
   .toString("hex")
});

  console.log("DECRYPT DEBUG", {
    brand,
    encryptedEmail,
    encryptedLength: encryptedEmail.length,
    secretLength: secret.length,
    firstFourChars: secret.slice(0, 4),
    lastFourChars: secret.slice(-4),
  });

  const decipher = crypto.createDecipheriv("aes-128-ecb", key, null);

  decipher.setAutoPadding(true);

  let decrypted = decipher.update(encryptedEmail, "base64", "utf8");

  decrypted += decipher.final("utf8");

  return decrypted;
}
