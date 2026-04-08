const DISPOSABLE_DOMAINS = new Set(["mailinator.com", "10minutemail.com", "guerrillamail.com", "tempmail.com", "yopmail.com"]);
const SHORTENER_DOMAINS = new Set(["bit.ly", "tinyurl.com", "t.co", "goo.gl", "buff.ly", "ow.ly"]);
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
  "invoice attached"
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

function extractLinks(html: string): string[] {
  return Array.from(html.matchAll(/https?:\/\/[^\s"'<>]+/g)).map((match) => match[0]);
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
  let risk = "low";
  const reasons: string[] = [];
  const domain = domainFromEmail(senderEmail);
  if (DISPOSABLE_DOMAINS.has(domain)) {
    risk = "high";
    reasons.push("Disposable sender domain");
  }
  if (senderName && ["support", "admin", "security", "billing"].includes(senderName.toLowerCase().trim())) {
    if (risk === "low") risk = "medium";
    reasons.push("Generic sender display name");
  }
  const lowerHeaders = Object.fromEntries(Object.entries(headers ?? {}).map(([key, value]) => [key.toLowerCase(), String(value).toLowerCase()]));
  if ((lowerHeaders["received-spf"] ?? "").includes("fail") || (lowerHeaders["authentication-results"] ?? "").includes("fail")) {
    risk = "high";
    reasons.push("SPF or DKIM failure");
  }
  const textBlob = `${subject ?? ""} ${bodyHtml ?? ""}`.toLowerCase();
  const hits = SUSPICIOUS_KEYWORDS.filter((keyword) => textBlob.includes(keyword));
  if (hits.length) {
    if (risk === "low") risk = "medium";
    reasons.push(`Suspicious language: ${hits.slice(0, 3).join(", ")}`);
  }
  for (const link of extractLinks(bodyHtml ?? "").slice(0, 10)) {
    let host = "";
    try {
      host = new URL(link).hostname.toLowerCase();
    } catch {
      continue;
    }
    if (link.startsWith("http://")) reasons.push("Contains non-HTTPS link");
    if (SHORTENER_DOMAINS.has(host)) reasons.push("Contains shortened link");
    if (host.includes("xn--")) reasons.push("Contains punycode link");
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host)) reasons.push("Contains direct IP link");
  }
  if (reasons.includes("Contains direct IP link")) risk = "high";
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
