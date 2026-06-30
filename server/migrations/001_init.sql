-- Multi-tenant foundation: users, their bots, each bot's knowledge, and auth sessions.
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  linkedin_sub text UNIQUE,
  email        citext,
  name         text NOT NULL DEFAULT '',
  avatar_url   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bots (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  handle              citext UNIQUE,
  status              text NOT NULL DEFAULT 'draft',          -- draft | published
  display_name        text NOT NULL DEFAULT '',               -- the assistant's name
  subject_name        text NOT NULL DEFAULT '',               -- the person it represents
  pronouns            jsonb NOT NULL DEFAULT '{"subject":"they","object":"them","possessive":"their"}'::jsonb,
  tone                text NOT NULL DEFAULT '',
  language_rule       text NOT NULL DEFAULT '',
  contact_email       text NOT NULL DEFAULT '',
  target_role         text NOT NULL DEFAULT '',
  budget_rest_message text NOT NULL DEFAULT '',
  suggested_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  extra_rules         jsonb NOT NULL DEFAULT '[]'::jsonb,      -- per-bot rules appended to platform defaults
  theme               jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- One bot per user for the MVP (the schema otherwise allows many).
CREATE UNIQUE INDEX bots_user_id_key ON bots(user_id);

CREATE TABLE knowledge_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id     uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  kind       text NOT NULL DEFAULT 'custom',   -- cv | experience | project | personal | custom
  title      text NOT NULL DEFAULT '',
  body       text NOT NULL DEFAULT '',
  position   integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX knowledge_items_bot_id_idx ON knowledge_items(bot_id);

CREATE TABLE sessions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
