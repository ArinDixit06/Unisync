import asyncio
import json
import time

import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings

_genai_configured = False
_failure_count = 0
_first_failure_time = 0.0
_circuit_open_until = 0.0

ALLOWED_PRIORITIES = {"high", "medium", "low"}
ALLOWED_RISKS = {"high", "medium", "low"}
ALLOWED_CATEGORIES = {"primary", "updates", "promotions", "social", "forums"}


def _ensure_configured():
    global _genai_configured
    if not _genai_configured:
        genai.configure(api_key=settings.gemini_api_key)
        _genai_configured = True


def _record_failure():
    global _failure_count, _first_failure_time, _circuit_open_until
    now = time.time()
    if _first_failure_time == 0 or now - _first_failure_time > 60:
        _first_failure_time = now
        _failure_count = 0
    _failure_count += 1
    if _failure_count >= 5:
        _circuit_open_until = now + 120
        _failure_count = 0
        _first_failure_time = 0


def _circuit_open() -> bool:
    return time.time() < _circuit_open_until


def _bounded_text(value: str, limit: int = 6000) -> str:
    cleaned = " ".join((value or "").split())
    return cleaned[:limit]


def _extract_json(text: str) -> dict | list:
    candidate = (text or "").strip()
    if candidate.startswith("```"):
        candidate = candidate.strip("`")
        if "\n" in candidate:
            candidate = candidate.split("\n", 1)[1]
        if candidate.endswith("```"):
            candidate = candidate[:-3]
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        start_obj = candidate.find("{")
        end_obj = candidate.rfind("}")
        start_list = candidate.find("[")
        end_list = candidate.rfind("]")
        if start_obj != -1 and end_obj != -1 and end_obj > start_obj:
            return json.loads(candidate[start_obj : end_obj + 1])
        if start_list != -1 and end_list != -1 and end_list > start_list:
            return json.loads(candidate[start_list : end_list + 1])
        raise


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=2))
async def _call_json(model_name: str, prompt: str) -> dict | list:
    if _circuit_open():
        raise RuntimeError("Gemini circuit open")
    _ensure_configured()
    model = genai.GenerativeModel(model_name)

    def _run():
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json", "temperature": 0.15},
        )
        return response.text

    try:
        text = await asyncio.wait_for(asyncio.to_thread(_run), timeout=15)
        return _extract_json(text)
    except Exception:
        _record_failure()
        raise


def _flash_model() -> str:
    return settings.gemini_model or "gemini-1.5-flash"


def _normalize_priority(data: dict | None) -> dict | None:
    if not isinstance(data, dict):
        return None
    priority = str(data.get("priority", "")).lower()
    if priority not in ALLOWED_PRIORITIES:
        return None
    reason = str(data.get("reason", "")).strip()[:240] or "Priority inferred from message content."
    confidence_raw = data.get("confidence", 0.5)
    try:
        confidence = max(0.0, min(1.0, float(confidence_raw)))
    except (TypeError, ValueError):
        confidence = 0.5
    return {"priority": priority, "reason": reason, "confidence": confidence}


def _normalize_risk(data: dict | None) -> dict | None:
    if not isinstance(data, dict):
        return None
    risk = str(data.get("risk", "")).lower()
    if risk not in ALLOWED_RISKS:
        return None
    reasons = [str(reason).strip()[:160] for reason in data.get("reasons", []) if str(reason).strip()]
    return {"risk": risk, "reasons": reasons[:5]}


async def summarize_email(text: str) -> list[str] | None:
    bounded = _bounded_text(text)
    if not bounded:
        return None
    prompt = (
        "Summarize this student-facing email into exactly 3 concise bullet points. "
        "Each bullet must be 6 to 15 words. Return JSON only as {\"bullets\": [..]}.\n\n"
        f"EMAIL:\n{bounded}"
    )
    data = await _call_json(_flash_model(), prompt)
    bullets = data.get("bullets") if isinstance(data, dict) else None
    if not isinstance(bullets, list):
        return None
    cleaned = [str(item).strip()[:120] for item in bullets if str(item).strip()]
    if len(cleaned) != 3:
        return None
    return cleaned


async def priority_analysis(sender: str, subject: str, body: str) -> dict | None:
    prompt = (
        "Assign priority for a student inbox. "
        "Consider deadlines, account actions, schedule changes, exams, finances, and urgency. "
        "Return JSON only as {priority: 'high'|'medium'|'low', reason: string, confidence: float}.\n\n"
        f"SENDER: {_bounded_text(sender, 200)}\nSUBJECT: {_bounded_text(subject, 300)}\nBODY: {_bounded_text(body)}"
    )
    return _normalize_priority(await _call_json(_flash_model(), prompt))


async def category_classification(sender: str, subject: str, snippet: str) -> str | None:
    prompt = (
        "Classify a student email into one of: primary, updates, promotions, social, forums. "
        "Return JSON only as {category: 'primary'|'updates'|'promotions'|'social'|'forums'}.\n\n"
        f"SENDER: {_bounded_text(sender, 200)}\nSUBJECT: {_bounded_text(subject, 300)}\nSNIPPET: {_bounded_text(snippet, 600)}"
    )
    data = await _call_json(_flash_model(), prompt)
    if isinstance(data, dict):
        category = str(data.get("category", "")).lower()
        if category in ALLOWED_CATEGORIES:
            return category
    return None


async def phishing_analysis(sender: str, subject: str, body: str) -> dict | None:
    prompt = (
        "Analyze this email for phishing, impersonation, credential theft, payment fraud, or manipulative urgency. "
        "Be conservative and return JSON only as {risk: 'low'|'medium'|'high', reasons: [string]}.\n\n"
        f"SENDER: {_bounded_text(sender, 200)}\nSUBJECT: {_bounded_text(subject, 300)}\nBODY: {_bounded_text(body)}"
    )
    return _normalize_risk(await _call_json("gemini-1.5-pro", prompt))


async def extract_events(body: str) -> list[dict] | None:
    bounded = _bounded_text(body)
    if not bounded:
        return None
    prompt = (
        "Extract real events or deadlines from this email body. "
        "Return JSON list only. Each item must have title, date, time, location, description, confidence. "
        "Only include items with confidence greater than 0.8.\n\n"
        f"BODY:\n{bounded}"
    )
    data = await _call_json("gemini-1.5-pro", prompt)
    if not isinstance(data, list):
        return None
    normalized: list[dict] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        try:
            confidence = float(item.get("confidence", 0))
        except (TypeError, ValueError):
            confidence = 0
        if confidence <= 0.8:
            continue
        normalized.append(
            {
                "title": str(item.get("title", "")).strip()[:140] or "Event",
                "date": str(item.get("date", "")).strip() or None,
                "time": str(item.get("time", "")).strip() or None,
                "location": str(item.get("location", "")).strip()[:160] or None,
                "description": str(item.get("description", "")).strip()[:240] or None,
                "confidence": confidence,
            }
        )
    return normalized or None
