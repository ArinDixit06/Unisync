import json
from datetime import datetime, timezone

import dateparser
from bs4 import BeautifulSoup
from dateparser.search import search_dates

from app.mail_crypto import decrypt_mail_json, decrypt_mail_text
from app.realtime_bus import publish_event
from app.services.cache import bump_user_cache_version
from app.services.gemini import (
    category_classification,
    extract_events,
    phishing_analysis,
    priority_analysis,
    summarize_email,
)
from app.services.security import deterministic_priority, deterministic_risk
from app.supabase_rest import insert, select, update


def _parse_event_datetime(date_value: str | None, time_value: str | None):
    if not date_value:
        return None
    combined = f"{date_value} {time_value}" if time_value else date_value
    return dateparser.parse(combined)


def _strip_html(html: str) -> str:
    if not html:
        return ""
    return BeautifulSoup(html, "html.parser").get_text(" ", strip=True)


def _fallback_events(body_html: str, subject: str | None) -> list[dict] | None:
    text = _strip_html(body_html)[:4000]
    if not text:
        return None
    matches = search_dates(
        text,
        settings={
            "PREFER_DATES_FROM": "future",
            "RETURN_AS_TIMEZONE_AWARE": True,
        },
    )
    if not matches:
        return None
    label, dt = matches[0]
    return [
        {
            "title": subject or "Event",
            "date": dt.date().isoformat(),
            "time": dt.time().strftime("%H:%M") if dt.time() else None,
            "location": None,
            "description": label,
            "confidence": 0.6,
        }
    ]


def _merge_reasons(*groups: list[str]) -> list[str]:
    merged: list[str] = []
    for group in groups:
        for reason in group:
            cleaned = str(reason).strip()
            if cleaned and cleaned not in merged:
                merged.append(cleaned[:160])
    return merged


def _choose_priority(ai_priority: dict | None, deterministic: dict | None) -> dict | None:
    if ai_priority and deterministic:
        order = {"low": 0, "medium": 1, "high": 2}
        ai_level = ai_priority.get("priority", "low")
        det_level = deterministic.get("priority", "low")
        if order.get(det_level, 0) > order.get(ai_level, 0):
            return deterministic
        if order.get(ai_level, 0) > order.get(det_level, 0):
            return ai_priority
        ai_reason = ai_priority.get("reason", "")
        det_reason = deterministic.get("reason", "")
        return {
            "priority": ai_level,
            "reason": "; ".join(part for part in [det_reason, ai_reason] if part)[:240],
            "confidence": max(float(ai_priority.get("confidence", 0.5)), float(deterministic.get("confidence", 0.5))),
        }
    return ai_priority or deterministic


async def process_email(ctx, email_id: str):
    emails = await select(
        "emails",
        "id,user_id,subject,sender_name,sender_email,preview_snippet,body_html,body_html_enc,raw_headers,raw_headers_enc",
        filters=[("id", "eq", email_id)],
        use_service=True,
    )
    if not emails:
        return
    email = emails[0]
    body_html = decrypt_mail_text(email.get("body_html_enc")) or email.get("body_html") or ""
    raw_headers = decrypt_mail_json(email.get("raw_headers_enc"), email.get("raw_headers") or {})

    await update(
        "emails",
        {
            "processing_status": "processing",
            "processing_started_at": datetime.now(timezone.utc).isoformat(),
            "processing_error": None,
        },
        filters=[("id", "eq", email_id)],
        use_service=True,
    )

    deterministic_risk_level, deterministic_risk_reasons = deterministic_risk(
        email["sender_email"],
        email.get("sender_name"),
        raw_headers,
        email.get("subject"),
        body_html,
    )
    deterministic_priority_data = deterministic_priority(email["sender_email"], email.get("subject"), body_html)

    summary = None
    priority = None
    category = None
    ai_risk = None
    events = None

    try:
        category = await category_classification(
            email["sender_email"],
            email.get("subject") or "",
            email.get("preview_snippet") or "",
        )
    except Exception:
        category = None

    try:
        priority = await priority_analysis(
            email["sender_email"],
            email.get("subject") or "",
            body_html,
        )
    except Exception:
        priority = None

    try:
        summary = await summarize_email(body_html)
    except Exception:
        summary = None

    if deterministic_risk_level != "high":
        try:
            ai_risk = await phishing_analysis(
                email["sender_email"],
                email.get("subject") or "",
                body_html,
            )
        except Exception:
            ai_risk = None

    try:
        events = await extract_events(body_html)
    except Exception:
        events = None

    if not events:
        events = _fallback_events(body_html, email.get("subject"))

    final_priority = _choose_priority(priority, deterministic_priority_data)

    final_risk = deterministic_risk_level
    if ai_risk:
        order = {"low": 0, "medium": 1, "high": 2}
        if order.get(ai_risk.get("risk", "low"), 0) > order.get(final_risk, 0):
            final_risk = ai_risk["risk"]
    final_reasons = _merge_reasons(deterministic_risk_reasons, (ai_risk or {}).get("reasons", []))

    await update(
        "emails",
        {
            "processing_status": "done",
            "processing_completed_at": datetime.now(timezone.utc).isoformat(),
            "summary_bullets": summary,
            "risk_level": final_risk,
            "risk_reasons": final_reasons,
            "priority_level": (final_priority or {}).get("priority"),
            "priority_reason": (final_priority or {}).get("reason"),
            "category": category or "primary",
        },
        filters=[("id", "eq", email_id)],
        use_service=True,
    )

    if events:
        existing = await select(
            "suggested_events",
            "id,title,start_datetime",
            filters=[("email_id", "eq", email_id), ("user_id", "eq", email["user_id"])],
            use_service=True,
        )
        existing_fingerprints = {
            json.dumps([item.get("title"), item.get("start_datetime")], default=str) for item in existing
        }
        for event in events:
            start_dt = _parse_event_datetime(event.get("date"), event.get("time"))
            fingerprint = json.dumps([event.get("title"), start_dt.isoformat() if start_dt else None], default=str)
            if fingerprint in existing_fingerprints:
                continue
            await insert(
                "suggested_events",
                {
                    "email_id": email_id,
                    "user_id": email["user_id"],
                    "title": event.get("title"),
                    "start_datetime": start_dt.isoformat() if start_dt else None,
                    "end_datetime": None,
                    "location": event.get("location"),
                    "description": event.get("description"),
                },
                use_service=True,
            )

    await publish_event(
        email["user_id"],
        {
            "type": "email_processed",
            "email_id": email_id,
            "processing_status": "done",
            "priority_level": (final_priority or {}).get("priority"),
            "risk_level": final_risk,
            "category": category or "primary",
        },
    )
    await bump_user_cache_version(email["user_id"])
