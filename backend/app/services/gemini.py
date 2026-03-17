import asyncio
import json
import time
from tenacity import retry, stop_after_attempt, wait_exponential
import google.generativeai as genai
from app.config import settings


_genai_configured = False
_failure_count = 0
_first_failure_time = 0.0
_circuit_open_until = 0.0


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


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=2))
async def _call_json(model_name: str, prompt: str) -> dict | list:
    if _circuit_open():
        raise RuntimeError("Gemini circuit open")
    _ensure_configured()
    model = genai.GenerativeModel(model_name)

    def _run():
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json", "temperature": 0.2},
        )
        return response.text

    try:
        text = await asyncio.wait_for(asyncio.to_thread(_run), timeout=15)
        return json.loads(text)
    except Exception:
        _record_failure()
        raise


def _flash_model() -> str:
    return settings.gemini_model or "gemini-1.5-flash"


async def summarize_email(text: str) -> list[str] | None:
    prompt = (
        "Summarize this email into exactly 3 bullet points. "
        "Each bullet must be <= 15 words. Return JSON: {\"bullets\": [..]}\n\n"
        f"EMAIL:\n{text}"
    )
    data = await _call_json(_flash_model(), prompt)
    bullets = data.get("bullets") if isinstance(data, dict) else None
    if not bullets or len(bullets) != 3:
        return None
    return bullets


async def priority_analysis(sender: str, subject: str, body: str) -> dict | None:
    prompt = (
        "Assign priority for a student inbox. "
        "Return JSON {priority: 'high'|'medium'|'low', reason: string, confidence: float}.\n\n"
        f"SENDER: {sender}\nSUBJECT: {subject}\nBODY: {body}"
    )
    data = await _call_json(_flash_model(), prompt)
    if isinstance(data, dict) and "priority" in data:
        return data
    return None


async def category_classification(sender: str, subject: str, snippet: str) -> str | None:
    prompt = (
        "Classify into one of: primary, updates, promotions, social, forums. "
        "Return JSON {category: 'primary'|'updates'|'promotions'|'social'|'forums'}.\n\n"
        f"SENDER: {sender}\nSUBJECT: {subject}\nSNIPPET: {snippet}"
    )
    data = await _call_json(_flash_model(), prompt)
    if isinstance(data, dict):
        return data.get("category")
    return None


async def phishing_analysis(sender: str, subject: str, body: str) -> dict | None:
    prompt = (
        "Analyze for phishing or manipulation. "
        "Return JSON {risk: 'low'|'medium'|'high', reasons: [string]}\n\n"
        f"SENDER: {sender}\nSUBJECT: {subject}\nBODY: {body}"
    )
    data = await _call_json("gemini-1.5-pro", prompt)
    if isinstance(data, dict) and "risk" in data:
        return data
    return None


async def extract_events(body: str) -> list[dict] | None:
    prompt = (
        "Extract events and deadlines. Return JSON list of objects with "
        "title, date, time, location, description, confidence. Only include confidence > 0.8.\n\n"
        f"BODY:\n{body}"
    )
    data = await _call_json("gemini-1.5-pro", prompt)
    if isinstance(data, list):
        return [item for item in data if item.get("confidence", 0) > 0.8]
    return None
