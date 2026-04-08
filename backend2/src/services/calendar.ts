export async function createEvent(
  accessToken: string,
  title: string,
  startDatetime: string,
  endDatetime: string | null,
  location: string | null,
  description: string | null
): Promise<any> {
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
    (error as any).status = response.status;
    (error as any).responseText = text;
    throw error;
  }
  return text ? JSON.parse(text) : {};
}
