import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { settings } from "./config.js";
function key() {
    return Buffer.from(settings.tokenEncryptionKey, "hex");
}
export function encrypt(plaintext) {
    if (plaintext == null)
        return "";
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key(), iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, ciphertext, tag]).toString("hex");
}
export function decrypt(ciphertextHex) {
    if (!ciphertextHex)
        return "";
    const raw = Buffer.from(ciphertextHex, "hex");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(raw.length - 16);
    const ciphertext = raw.subarray(12, raw.length - 16);
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
