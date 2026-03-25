-- Backfill tags dictionary từ event_tags cũ
INSERT INTO "tags" ("name")
SELECT DISTINCT et."tag"
FROM "event_tags" et
WHERE et."tag" IS NOT NULL
ON CONFLICT ("name") DO NOTHING;

-- Backfill junction links
INSERT INTO "event_tag_links" ("event_id", "tag_id")
SELECT et."event_id", t."id"
FROM "event_tags" et
JOIN "tags" t ON t."name" = et."tag"
ON CONFLICT ("event_id", "tag_id") DO NOTHING;