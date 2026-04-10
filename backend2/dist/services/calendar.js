export async function createEvent(accessToken, title, startDatetime, endDatetime, location, description) {
    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            summary: title,
            start: { dateTime: startDatetime },
            end: { dateTime: endDatetime ?? startDatetime },
            location,
            description
        })
    });
    const text = await response.text();
    if (!response.ok) {
        const error = new Error(text || response.statusText);
        error.status = response.status;
        error.responseText = text;
        throw error;
    }
    return text ? JSON.parse(text) : {};
}
