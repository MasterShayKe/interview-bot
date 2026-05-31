# Project: End-to-End AI Business Operations Stack
For a small financial-services business, Shay built the entire operational stack
end to end, as a single person:

- A custom CRM as the system of record for clients and leads.
- A customer-support AI channel on WhatsApp that handles inbound customer
  questions automatically.
- An automated leads system that monitors WhatsApp and email for new inquiries,
  creates the lead in the CRM, and notifies the business owner in real time.
- A multi-agent assistant (Node.js / TypeScript) with a customer-facing agent
  and a private executive-assistant agent, routed by phone number across
  WhatsApp and Telegram. It uses an agentic tool-use loop to handle lead intake,
  booking, and follow-ups via the CRM, Calendly, Google Calendar, and Gmail
  (OAuth2), plus the Meta WhatsApp Cloud API and scheduled reminders and daily
  briefings.

The result is a hands-off pipeline from first contact through booking and
ongoing engagement - built, integrated, and operated by one person. (Built for a
private financial-services business; the business name is kept confidential.)
