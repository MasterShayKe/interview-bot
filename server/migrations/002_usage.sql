-- Persisted per-bot token usage, aggregated by day. Powers the daily cap
-- (survives restarts, unlike the in-memory guard) and the owner analytics.
CREATE TABLE bot_usage (
  bot_id        uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  day           date NOT NULL,
  requests      integer NOT NULL DEFAULT 0,
  input_tokens  bigint  NOT NULL DEFAULT 0,
  output_tokens bigint  NOT NULL DEFAULT 0,
  total_tokens  bigint  NOT NULL DEFAULT 0,
  PRIMARY KEY (bot_id, day)
);
