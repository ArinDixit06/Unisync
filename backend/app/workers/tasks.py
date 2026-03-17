import json
from datetime import datetime, timezone
import dateparser
from dateparser.search import search_dates
from bs4 import BeautifulSoup
from app.supabase_rest import select, update, insert
from app.services.security import deterministic_risk
from app.services.gemini import (
    summarize_email,
    priority_analysis,
    category_classification,
    phishing_analysis,
    extract_events,
)
from app.realtime_bus import publish_event


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


async def process_email(ctx, email_id: str):
    emails = await select(
        "emails",
        "id,user_id,subject,sender_name,sender_email,preview_snippet,body_html,raw_headers",
        filters=[("id", "eq", email_id)],
        use_service=True,
    )
    if not emails:
        return
    email = emails[0]

    await update(
        "emails",
        {
            "processing_status": "processing",
            "processing_started_at": datetime.now(timezone.utc).isoformat(),
        },
        filters=[("id", "eq", email_id)],
        use_service=True,
    )

    risk_level, risk_reasons = deterministic_risk(
        email["sender_email"], email["sender_name"], email["raw_headers"]
    )

    summary = None
    priority = None
    category = None
    gemini_risk = None
    events = None

    try:
        category = await category_classification(
            email["sender_email"], email["subject"] or "", email["preview_snippet"] or ""
        )
    except Exception:
        category = None

    try:
        priority = await priority_analysis(
            email["sender_email"], email["subject"] or "", email["body_html"] or ""
        )
    except Exception:
        priority = None

    try:
        summary = await summarize_email(email["body_html"] or "")
    except Exception:
        summary = None

    if risk_level != "high":
        try:
            gemini_risk = await phishing_analysis(
                email["sender_email"], email["subject"] or "", email["body_html"] or ""
            )
        except Exception:
            gemini_risk = None

    try:
        events = await extract_events(email["body_html"] or "")
    except Exception:
        events = None

    if not events:
        events = _fallback_events(email["body_html"] or "", email.get("subject"))

    final_risk = gemini_risk.get("risk") if gemini_risk else risk_level
    final_reasons = (gemini_risk.get("reasons") if gemini_risk else []) + risk_reasons

    await update(
        "emails",
        {
            "processing_status": "done",
            "processing_completed_at": datetime.now(timezone.utc).isoformat(),
            "summary_bullets": summary,
            "risk_level": final_risk,
            "risk_reasons": final_reasons,
            "priority_level": (priority or {}).get("priority"),
            "priority_reason": (priority or {}).get("reason"),
            "category": category or "primary",
        },
        filters=[("id", "eq", email_id)],
        use_service=True,
    )

    if events:
        for event in events:
            start_dt = _parse_event_datetime(event.get("date"), event.get("time"))
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
            "priority_level": (priority or {}).get("priority"),
            "risk_level": final_risk,
            "category": category or "primary",
        },
    )
