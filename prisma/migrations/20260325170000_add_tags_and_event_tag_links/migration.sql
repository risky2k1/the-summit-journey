-- 1) Dictionary table
CREATE TABLE IF NOT EXISTS "tags" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Junction table
CREATE TABLE IF NOT EXISTS "event_tag_links" (
    "id" SERIAL PRIMARY KEY,
    "event_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    CONSTRAINT "event_tag_links_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "events"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_tag_links_tag_id_fkey"
    FOREIGN KEY ("tag_id") REFERENCES "tags"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_tag_links_event_id_tag_id_key"
    UNIQUE ("event_id", "tag_id")
);

CREATE INDEX IF NOT EXISTS "event_tag_links_event_id_idx" ON "event_tag_links" ("event_id");
CREATE INDEX IF NOT EXISTS "event_tag_links_tag_id_idx" ON "event_tag_links" ("tag_id");