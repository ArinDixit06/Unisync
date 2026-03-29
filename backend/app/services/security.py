import re
from urllib.parse import urlparse

DISPOSABLE_DOMAINS = {
    "mailinator.com",
    "10minutemail.com",
    "guerrillamail.com",
    "tempmail.com",
    "yopmail.com",
}

SHORTENER_DOMAINS = {
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "goo.gl",
    "buff.ly",
    "ow.ly",
}

SUSPICIOUS_KEYWORDS = {
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
}

HIGH_PRIORITY_KEYWORDS = {
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
    "important",
}

MEDIUM_PRIORITY_KEYWORDS = {
    "meeting",
    "event",
    "office hours",
    "reminder",
    "follow up",
    "follow-up",
    "application",
    "submission",
    "approved",
    "requested",
}

RISK_ORDER = {"low": 0, "medium": 1, "high": 2}
PRIORITY_ORDER = {"low": 0, "medium": 1, "high": 2}


def domain_from_email(address: str) -> str:
    if "@" not in address:
        return ""
    return address.split("@", 1)[1].lower().strip()


def _max_risk(current: str, candidate: str) -> str:
    return candidate if RISK_ORDER[candidate] > RISK_ORDER[current] else current


def _max_priority(current: str, candidate: str) -> str:
    return candidate if PRIORITY_ORDER[candidate] > PRIORITY_ORDER[current] else current


def _header_value(headers: dict | None, key: str) -> str:
    if not headers:
        return ""
    return str(headers.get(key, "")).lower()


def sanitize_headers(headers: dict | None) -> dict:
    if not headers:
        return {}
    allowed = {
        "from",
        "to",
        "subject",
        "date",
        "received-spf",
        "authentication-results",
        "reply-to",
        "return-path",
        "message-id",
    }
    sanitized: dict[str, str] = {}
    for key, value in headers.items():
        normalized_key = str(key).lower().strip()
        if normalized_key in allowed:
            sanitized[normalized_key] = str(value).strip()[:500]
    return sanitized


def extract_links(html: str) -> list[str]:
    if not html:
        return []
    links = re.findall(r"https?://[^\s\"'<>]+", html)
    valid: list[str] = []
    for token in links:
        try:
            parsed = urlparse(token)
            if parsed.scheme in {"http", "https"} and parsed.netloc:
                valid.append(token)
        except Exception:
            continue
    return valid


def _suspicious_link_reasons(links: list[str]) -> list[str]:
    reasons: list[str] = []
    for link in links[:10]:
        parsed = urlparse(link)
        host = parsed.netloc.lower()
        if parsed.scheme == "http":
            reasons.append("Contains non-HTTPS link")
        if host in SHORTENER_DOMAINS:
            reasons.append("Contains shortened link")
        if "xn--" in host:
            reasons.append("Contains punycode link")
        if re.fullmatch(r"(?:\d{1,3}\.){3}\d{1,3}", host.split(":")[0]):
            reasons.append("Contains direct IP link")
    return reasons


def deterministic_risk(
    sender_email: str,
    sender_name: str | None,
    headers: dict | None,
    subject: str | None = None,
    body_html: str | None = None,
):
    reasons: list[str] = []
    risk = "low"

    domain = domain_from_email(sender_email)
    if domain in DISPOSABLE_DOMAINS:
        reasons.append("Disposable sender domain")
        risk = _max_risk(risk, "high")

    if sender_name and sender_name.lower().strip() in {"support", "admin", "security", "billing"}:
        reasons.append("Generic sender display name")
        risk = _max_risk(risk, "medium")

    spf = _header_value(headers, "received-spf")
    auth_results = _header_value(headers, "authentication-results")
    if "fail" in spf or "fail" in auth_results:
        reasons.append("SPF or DKIM failure")
        risk = _max_risk(risk, "high")

    if sender_email and subject and sender_email.split("@", 1)[0].lower() in {"security", "billing", "support"}:
        if any(keyword in subject.lower() for keyword in {"urgent", "verify", "password", "invoice"}):
            reasons.append("High-risk impersonation pattern")
            risk = _max_risk(risk, "high")

    text_blob = " ".join(part for part in [subject or "", body_html or ""] if part).lower()
    keyword_hits = [keyword for keyword in SUSPICIOUS_KEYWORDS if keyword in text_blob]
    if keyword_hits:
        reasons.append(f"Suspicious language: {', '.join(keyword_hits[:3])}")
        risk = _max_risk(risk, "medium")

    link_reasons = _suspicious_link_reasons(extract_links(body_html or ""))
    if link_reasons:
        reasons.extend(link_reasons[:3])
        risk = _max_risk(risk, "high" if "Contains direct IP link" in link_reasons else "medium")

    unique_reasons = list(dict.fromkeys(reasons))
    return risk, unique_reasons


def deterministic_priority(sender_email: str, subject: str | None, body_html: str | None) -> dict | None:
    text_blob = " ".join(part for part in [subject or "", body_html or ""] if part).lower()
    priority = "low"
    reasons: list[str] = []

    for keyword in HIGH_PRIORITY_KEYWORDS:
        if keyword in text_blob:
            priority = _max_priority(priority, "high")
            reasons.append(f"Contains urgent keyword '{keyword}'")

    for keyword in MEDIUM_PRIORITY_KEYWORDS:
        if keyword in text_blob:
            priority = _max_priority(priority, "medium")
            reasons.append(f"Contains workflow keyword '{keyword}'")

    domain = domain_from_email(sender_email)
    if domain.endswith(".edu"):
        priority = _max_priority(priority, "medium")
        reasons.append("Academic sender domain")

    if priority == "low" and not reasons:
        return None

    return {
        "priority": priority,
        "reason": "; ".join(dict.fromkeys(reasons))[:240] or "Priority inferred from sender and message context.",
        "confidence": 0.7 if priority == "high" else 0.6,
    }
