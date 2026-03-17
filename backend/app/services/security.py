from urllib.parse import urlparse

DISPOSABLE_DOMAINS = {
    "mailinator.com",
    "10minutemail.com",
    "guerrillamail.com",
    "tempmail.com",
    "yopmail.com",
}

RISK_ORDER = {"low": 0, "medium": 1, "high": 2}


def domain_from_email(address: str) -> str:
    if "@" not in address:
        return ""
    return address.split("@", 1)[1].lower().strip()


def _max_risk(current: str, candidate: str) -> str:
    return candidate if RISK_ORDER[candidate] > RISK_ORDER[current] else current


def deterministic_risk(sender_email: str, sender_name: str | None, headers: dict | None):
    reasons = []
    risk = "low"

    domain = domain_from_email(sender_email)
    if domain in DISPOSABLE_DOMAINS:
        reasons.append("Disposable sender domain")
        risk = _max_risk(risk, "high")

    if sender_name and sender_name.lower().strip() in {"support", "admin", "security"}:
        reasons.append("Generic sender display name")
        risk = _max_risk(risk, "medium")

    if headers:
        spf = str(headers.get("received-spf", "")).lower()
        dkim = str(headers.get("authentication-results", "")).lower()
        if "fail" in spf or "fail" in dkim:
            reasons.append("SPF/DKIM failure")
            risk = _max_risk(risk, "high")

    return risk, reasons


def extract_links(html: str) -> list[str]:
    links = []
    for token in html.split():
        if token.startswith("http://") or token.startswith("https://"):
            try:
                parsed = urlparse(token)
                if parsed.netloc:
                    links.append(token)
            except Exception:
                continue
    return links
