import { decrypt, encrypt } from "./crypto.js";

const MAIL_ARMOR_HEADER = "-----BEGIN UNISYNC SECURE MAIL-----";
const MAIL_ARMOR_FOOTER = "-----END UNISYNC SECURE MAIL-----";
const MAX_SECURE_TEXT_CHARS = 100_000;

function armor(ciphertext: string): string {
  return [
    MAIL_ARMOR_HEADER,
    "Version: UniSync-Mail-1",
    "Cipher: AES-256-GCM",
    "",
    ciphertext,
    MAIL_ARMOR_FOOTER
  ].join("\n");
}

function unarmor(value: string): string {
  const lines = value.trim().split(/\r?\n/).map((line) => line.trimEnd());
  if (lines.length < 5 || lines[0] !== MAIL_ARMOR_HEADER || lines.at(-1) !== MAIL_ARMOR_FOOTER) {
    throw new Error("Value is not a UniSync armored payload");
  }
  return lines.slice(1, -1).filter((line) => line && !line.includes(":")).join("");
}

export function isMailArmored(value: unknown): value is string {
  return typeof value === "string" && value.trim().startsWith(MAIL_ARMOR_HEADER);
}

export function encryptMailText(value: string | null | undefined): string | null {
  if (value == null) return null;
  return armor(encrypt(value.slice(0, MAX_SECURE_TEXT_CHARS)));
}

export function decryptMailText(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (!isMailArmored(value)) return value;
  return decrypt(unarmor(value));
}

export function encryptMailJson(value: unknown): string | null {
  if (value == null) return null;
  return encryptMailText(JSON.stringify(value));
}

export function decryptMailJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "object") return value as T;
  const decoded = decryptMailText(String(value));
  if (!decoded) return fallback;
  try {
    return JSON.parse(decoded) as T;
  } catch {
    return fallback;
  }
}
