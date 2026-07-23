import crypto from "crypto";

export function decryptEmail(
  encryptedEmail: string
): string {
  const secret = process.env.BV_EMAIL_SHARED_KEY;

  if (!secret) {
    throw new Error("Missing BV_EMAIL_SHARED_KEY");
  }

  const key = Buffer.from(secret, "utf8").subarray(0, 16);

  const decipher = crypto.createDecipheriv(
    "aes-128-ecb",
    key,
    null
  );

  decipher.setAutoPadding(true);

  let decrypted = decipher.update(
    encryptedEmail,
    "base64",
    "utf8"
  );

  decrypted += decipher.final("utf8");

  return decrypted;
}