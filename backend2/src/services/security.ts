const DISPOSABLE_DOMAINS = new Set(["mailinator.com", "10minutemail.com", "guerrillamail.com", "tempmail.com", "yopmail.com"]);
const SHORTENER_DOMAINS = new Set(["bit.ly", "tinyurl.com", "t.co", "goo.gl", "buff.ly", "ow.ly"]);
const TRUSTED_STUDENT_DOMAINS = [".edu", ".ac.in", ".edu.in"];
const SUSPICIOUS_KEYWORDS = [
  "password reset",
  "verify your account",
  "login immediately",
  "gift card",
  "wire transfer",
  "crypto",
  "bank account",
  "urgent action",
  "click below",
  "suspend",
  "invoice attached",
  "verify now",
  "confirm your identity",
  "your account will be closed",
  "reset within 24 hours",
  "payment failed",
  "unusual sign in",
  "unauthorized login",
  "purchase gift cards",
  "bank details",
  "wire instructions"
];
const HIGH_PRIORITY_KEYWORDS = [
  "deadline",
  "due today",
  "due tomorrow",
  "assignment",
  "exam",
  "interview",
  "tuition",
  "financial aid",
  "payment due",
  "action required",
  "registration",
  "schedule change",
  "important"
];
const MEDIUM_PRIORITY_KEYWORDS = ["meeting", "event", "office hours", "reminder", "follow up", "follow-up", "application", "submission", "approved", "requested"];

function domainFromEmail(address: string): string {
  return address.includes("@") ? address.split("@", 2)[1].toLowerCase().trim() : "";
}

function rootDomain(host: string): string {
  const normalized = host.toLowerCase().trim();
  const parts = normalized.split(".").filter(Boolean);
  if (parts.length <= 2) return normalized;
  return parts.slice(-2).join(".");
}

function extractLinks(html: string): string[] {
  return Array.from(html.matchAll(/https?:\/\/[^\s"'<>]+/g)).map((match) => match[0]);
}

function includesSuspiciousUnicode(value: string): boolean {
  return /[\u200B-\u200F\u202A-\u202E]/.test(value);
}

function hasTrustedAcademicDomain(domain: string): boolean {
  return TRUSTED_STUDENT_DOMAINS.some((suffix) => domain.endsWith(suffix));
}

export function sanitizeHeaders(headers: Record<string, unknown> | null | undefined): Record<string, string> {
  if (!headers) return {};
  const allowed = new Set(["from", "to", "subject", "date", "received-spf", "authentication-results", "reply-to", "return-path", "message-id"]);
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const normalized = key.toLowerCase().trim();
    if (allowed.has(normalized)) sanitized[normalized] = String(value).slice(0, 500);
  }
  return sanitized;
}

export function deterministicRisk(
  senderEmail: string,
  senderName?: string | null,
  headers?: Record<string, unknown> | null,
  subject?: string | null,
  bodyHtml?: string | null
): [string, string[]] {
  let riskScore = 0;
  const reasons: string[] = [];
  const domain = domainFromEmail(senderEmail);
  if (DISPOSABLE_DOMAINS.has(domain)) {
    riskScore += 4;
    reasons.push("Disposable sender domain");
  }
  if (senderName && ["support", "admin", "security", "billing"].includes(senderName.toLowerCase().trim())) {
    riskScore += 1;
    reasons.push("Generic sender display name");
  }
  const lowerHeaders = Object.fromEntries(Object.entries(headers ?? {}).map(([key, value]) => [key.toLowerCase(), String(value).toLowerCase()]));
  if ((lowerHeaders["received-spf"] ?? "").includes("fail") || (lowerHeaders["authentication-results"] ?? "").includes("fail")) {
    riskScore += 4;
    reasons.push("SPF or DKIM failure");
  }
  const replyTo = String(lowerHeaders["reply-to"] ?? "");
  const returnPath = String(lowerHeaders["return-path"] ?? "");
  const replyToDomain = domainFromEmail(replyTo);
  const returnPathDomain = domainFromEmail(returnPath);
  if (replyToDomain && domain && rootDomain(replyToDomain) !== rootDomain(domain)) {
    riskScore += 2;
    reasons.push("Reply-to domain does not match sender");
  }
  if (returnPathDomain && domain && rootDomain(returnPathDomain) !== rootDomain(domain)) {
    riskScore += 2;
    reasons.push("Return-path domain does not match sender");
  }
  const textBlob = `${subject ?? ""} ${bodyHtml ?? ""}`.toLowerCase();
  const hits = SUSPICIOUS_KEYWORDS.filter((keyword) => textBlob.includes(keyword));
  if (hits.length) {
    riskScore += hits.length >= 3 ? 3 : 2;
    reasons.push(`Suspicious language: ${hits.slice(0, 3).join(", ")}`);
  }
  if (includesSuspiciousUnicode(`${senderName ?? ""} ${subject ?? ""}`)) {
    riskScore += 2;
    reasons.push("Contains hidden or spoofing characters");
  }
  if (senderName && domain) {
    const normalizedName = senderName.toLowerCase();
    const academicLooking = /(university|college|registrar|financial aid|student services|it help|security)/.test(normalizedName);
    if (academicLooking && !hasTrustedAcademicDomain(domain)) {
      riskScore += 3;
      reasons.push("Sender claims institution identity from non-academic domain");
    }
  }
  for (const link of extractLinks(bodyHtml ?? "").slice(0, 10)) {
    let host = "";
    try {
      host = new URL(link).hostname.toLowerCase();
    } catch {
      continue;
    }
    if (link.startsWith("http://")) {
      riskScore += 2;
      reasons.push("Contains non-HTTPS link");
    }
    if (SHORTENER_DOMAINS.has(host)) {
      riskScore += 2;
      reasons.push("Contains shortened link");
    }
    if (host.includes("xn--")) {
      riskScore += 3;
      reasons.push("Contains punycode link");
    }
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host)) {
      riskScore += 4;
      reasons.push("Contains direct IP link");
    }
    if (domain && rootDomain(host) !== rootDomain(domain) && /(login|verify|secure|account|auth|signin|reset|update)/.test(link.toLowerCase())) {
      riskScore += 2;
      reasons.push("Link domain differs from sender domain");
    }
  }
  const risk = riskScore >= 6 ? "high" : riskScore >= 3 ? "medium" : "low";
  return [risk, Array.from(new Set(reasons)).slice(0, 5)];
}

export function deterministicPriority(senderEmail: string, subject?: string | null, bodyHtml?: string | null) {
  const textBlob = `${subject ?? ""} ${bodyHtml ?? ""}`.toLowerCase();
  let priority = "low";
  const reasons: string[] = [];
  for (const keyword of HIGH_PRIORITY_KEYWORDS) {
    if (textBlob.includes(keyword)) {
      priority = "high";
      reasons.push(`Contains urgent keyword '${keyword}'`);
    }
  }
  for (const keyword of MEDIUM_PRIORITY_KEYWORDS) {
    if (textBlob.includes(keyword) && priority !== "high") {
      priority = "medium";
      reasons.push(`Contains workflow keyword '${keyword}'`);
    }
  }
  if (domainFromEmail(senderEmail).endsWith(".edu") && priority === "low") {
    priority = "medium";
    reasons.push("Academic sender domain");
  }
  if (priority === "low" && !reasons.length) return null;
  return {
    priority,
    reason: Array.from(new Set(reasons)).join("; ").slice(0, 240),
    confidence: priority === "high" ? 0.7 : 0.6
  };
}
