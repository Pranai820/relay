export const EMAIL_TEMPLATES = [
  {
    id: "leave",
    label: "Leave request",
    subject: "Leave request — {start_date} to {end_date}",
    body: "Hi {manager},\n\nI would like to request leave from {start_date} to {end_date}.\n\nReason: {reason}\n\nPlease let me know if you need anything covered while I'm away.\n\nThank you,\n{name}",
    tokens: [
      { key: "name", label: "Your name", placeholder: "Alex" },
      { key: "manager", label: "Manager name", placeholder: "Jordan" },
      { key: "start_date", label: "Start date", placeholder: "2026-06-10" },
      { key: "end_date", label: "End date", placeholder: "2026-06-12" },
      { key: "reason", label: "Reason", placeholder: "Personal leave" },
    ],
  },
  {
    id: "vacation",
    label: "Vacation / PTO",
    subject: "Vacation request — {start_date} to {end_date}",
    body: "Hi {manager},\n\nI'm planning to take PTO from {start_date} through {end_date}. I'll make sure my current tasks are handed off before I leave.\n\nThanks,\n{name}",
    tokens: [
      { key: "name", label: "Your name", placeholder: "Alex" },
      { key: "manager", label: "Manager name", placeholder: "Jordan" },
      { key: "start_date", label: "Start date", placeholder: "2026-07-01" },
      { key: "end_date", label: "End date", placeholder: "2026-07-05" },
    ],
  },
  {
    id: "sick",
    label: "Sick leave",
    subject: "Sick leave — {date}",
    body: "Hi {manager},\n\nI'm not feeling well today ({date}) and will be taking a sick day. I'll update you if I need additional time off.\n\n{name}",
    tokens: [
      { key: "name", label: "Your name", placeholder: "Alex" },
      { key: "manager", label: "Manager name", placeholder: "Jordan" },
      { key: "date", label: "Date", placeholder: "2026-06-06" },
    ],
  },
  {
    id: "invitation",
    label: "Meeting invitation",
    subject: "Meeting: {topic} on {date}",
    body: "Hi {recipient},\n\nI'd like to invite you to a meeting about {topic} on {date} at {time}.\n\nAgenda:\n{agenda}\n\nPlease let me know if that time works.\n\nBest,\n{name}",
    tokens: [
      { key: "name", label: "Your name", placeholder: "Alex" },
      { key: "recipient", label: "Recipient name", placeholder: "Sam" },
      { key: "topic", label: "Topic", placeholder: "Project sync" },
      { key: "date", label: "Date", placeholder: "2026-06-10" },
      { key: "time", label: "Time", placeholder: "2:00 PM" },
      { key: "agenda", label: "Agenda", placeholder: "Status update and next steps" },
    ],
  },
  {
    id: "followup",
    label: "Follow-up",
    subject: "Following up: {topic}",
    body: "Hi {recipient},\n\nJust following up on {topic}. {details}\n\nLet me know if you have any questions.\n\nThanks,\n{name}",
    tokens: [
      { key: "name", label: "Your name", placeholder: "Alex" },
      { key: "recipient", label: "Recipient name", placeholder: "Sam" },
      { key: "topic", label: "Topic", placeholder: "our last conversation" },
      { key: "details", label: "Details", placeholder: "Wanted to check if you had a chance to review the doc." },
    ],
  },
  {
    id: "thankyou",
    label: "Thank you",
    subject: "Thank you — {topic}",
    body: "Hi {recipient},\n\nThank you for {topic}. I really appreciate your help.\n\nBest,\n{name}",
    tokens: [
      { key: "name", label: "Your name", placeholder: "Alex" },
      { key: "recipient", label: "Recipient name", placeholder: "Sam" },
      { key: "topic", label: "What you're thanking for", placeholder: "your quick feedback" },
    ],
  },
  {
    id: "reschedule",
    label: "Reschedule / apology",
    subject: "Rescheduling: {topic}",
    body: "Hi {recipient},\n\nApologies — I need to reschedule {topic} originally planned for {original_time}. Would {new_time} work instead?\n\nSorry for the inconvenience.\n\n{name}",
    tokens: [
      { key: "name", label: "Your name", placeholder: "Alex" },
      { key: "recipient", label: "Recipient name", placeholder: "Sam" },
      { key: "topic", label: "Meeting / topic", placeholder: "our call" },
      { key: "original_time", label: "Original time", placeholder: "Tuesday 3 PM" },
      { key: "new_time", label: "Proposed new time", placeholder: "Wednesday 11 AM" },
    ],
  },
  {
    id: "reminder",
    label: "Reminder",
    subject: "Reminder: {topic}",
    body: "Hi {recipient},\n\nFriendly reminder about {topic} due on {due_date}.\n\n{details}\n\nThanks,\n{name}",
    tokens: [
      { key: "name", label: "Your name", placeholder: "Alex" },
      { key: "recipient", label: "Recipient name", placeholder: "Sam" },
      { key: "topic", label: "Topic", placeholder: "invoice submission" },
      { key: "due_date", label: "Due date", placeholder: "2026-06-15" },
      { key: "details", label: "Details", placeholder: "Please submit via the portal." },
    ],
  },
  {
    id: "ooo",
    label: "Out of office",
    subject: "Out of office — {start_date} to {end_date}",
    body: "Hi,\n\nI'm out of office from {start_date} to {end_date} with limited email access. For urgent matters, contact {backup_contact}.\n\nI'll respond when I'm back.\n\n{name}",
    tokens: [
      { key: "name", label: "Your name", placeholder: "Alex" },
      { key: "start_date", label: "Start date", placeholder: "2026-06-10" },
      { key: "end_date", label: "End date", placeholder: "2026-06-14" },
      { key: "backup_contact", label: "Backup contact", placeholder: "Jordan (jordan@company.com)" },
    ],
  },
];

export function applyTemplate(template, values) {
  const replace = (text) => String(text || "").replace(/\{(\w+)\}/g, (_, key) => values[key] ?? `{${key}}`);
  return {
    subject: replace(template.subject),
    body: replace(template.body),
  };
}
