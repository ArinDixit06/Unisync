import httpx


async def create_event(access_token: str, title: str, start_datetime: str, end_datetime: str | None, location: str | None, description: str | None):
    headers = {"Authorization": f"Bearer {access_token}"}
    payload = {
        "summary": title,
        "start": {"dateTime": start_datetime},
        "end": {"dateTime": end_datetime or start_datetime},
        "location": location,
        "description": description,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            headers=headers,
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()
