# Project: Multi-Channel AI Assistant (WhatsApp + Telegram)
Shay built a multi-agent assistant (Node.js / TypeScript) serving a
customer-facing agent and a private executive-assistant agent, routed
automatically by phone number across WhatsApp and Telegram. It uses an agentic
tool-use loop: agents autonomously handle lead intake, booking, and follow-ups
via integrations with a CRM, Calendly, Google Calendar, and Gmail (OAuth2). It
integrates the Meta WhatsApp Cloud API and runs scheduled automations for
meeting reminders and a merged daily morning briefing, and automates the full
lead-to-client CRM lifecycle via booking webhooks and templated messaging.
