export function isEventMine(event, userEmail) {
  if (event?.organizer?.self || event?.creator?.self) return true;
  const email = String(userEmail || "").toLowerCase();
  if (!email) return false;
  return [event?.organizer?.email, event?.creator?.email]
    .filter(Boolean)
    .map((value) => value.toLowerCase())
    .includes(email);
}

function extractEvent(raw) {
  return raw?.data ?? raw?.event ?? raw;
}

export async function assertOwnCalendarEvent({
  executeTool,
  userId,
  connectedAccountId,
  userEmail,
  eventId,
  calendarId = "primary",
}) {
  if (!eventId) throw new Error("Missing event_id.");

  const raw = await executeTool({
    toolSlug: "GOOGLECALENDAR_EVENTS_GET",
    userId,
    connectedAccountId,
    args: { calendar_id: calendarId, event_id: eventId },
  });

  const event = extractEvent(raw);
  if (!event?.id) throw new Error("Event not found.");

  if (!isEventMine(event, userEmail)) {
    throw new Error("You can only edit or delete events you created.");
  }

  return event;
}
