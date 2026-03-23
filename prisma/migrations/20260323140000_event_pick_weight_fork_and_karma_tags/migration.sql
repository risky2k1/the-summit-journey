-- Trọng số event khi random pool (findNextEvent)
ALTER TABLE "events" ADD COLUMN "pick_weight" INTEGER NOT NULL DEFAULT 1;

-- Demo nhánh: tại "Con đường mòn" (event 2), lối thung lũng tới thẳng "Lão nhân gánh củi" (event 4), bỏ qua "Tiếng động trong bụi" (event 3)
UPDATE "choices" SET "next_event_id" = 4 WHERE "id" = 4;

-- Vài màn xuất hiện thường xuyên hơn khi random (so với pick_weight = 1)
UPDATE "events" SET "pick_weight" = 2 WHERE "id" IN (7, 11);
UPDATE "events" SET "pick_weight" = 3 WHERE "id" IN (9, 14);

-- Tag karma — lọc pool khi karma cực đoan (đã có tag chapter/encounter từ seed)
INSERT INTO "event_tags" ("event_id", "tag") VALUES (7, 'ma_dao') ON CONFLICT ("event_id", "tag") DO NOTHING;
INSERT INTO "event_tags" ("event_id", "tag") VALUES (8, 'ma_dao') ON CONFLICT ("event_id", "tag") DO NOTHING;
INSERT INTO "event_tags" ("event_id", "tag") VALUES (11, 'chinh_dao') ON CONFLICT ("event_id", "tag") DO NOTHING;
INSERT INTO "event_tags" ("event_id", "tag") VALUES (12, 'chinh_dao') ON CONFLICT ("event_id", "tag") DO NOTHING;
