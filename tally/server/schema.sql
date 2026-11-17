CREATE TABLE IF NOT EXISTS tally_assistant_states (
  owner_id text PRIMARY KEY,
  revision integer NOT NULL CHECK (revision > 0),
  data jsonb NOT NULL,
  memory_markdown text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tally_recipes (
  id uuid PRIMARY KEY,
  owner_id text NOT NULL,
  request_id uuid NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, request_id)
);
CREATE INDEX IF NOT EXISTS tally_recipes_owner_created ON tally_recipes(owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS tally_grocery_lists (
  id uuid PRIMARY KEY,
  owner_id text NOT NULL,
  request_id uuid NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, request_id)
);
CREATE INDEX IF NOT EXISTS tally_lists_owner_created ON tally_grocery_lists(owner_id, created_at DESC);
