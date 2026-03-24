-- Campaign / chapter metadata + stable event slug (`ref`) từ pipeline n8n.

CREATE TABLE "campaigns" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "total_chapters" INTEGER NOT NULL,
    "total_events" INTEGER NOT NULL,
    "start_event_ref" TEXT NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chapters" (
    "id" SERIAL NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "chapter_index" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary_one_line" TEXT NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"("slug");

CREATE UNIQUE INDEX "chapters_campaign_id_chapter_index_key" ON "chapters"("campaign_id", "chapter_index");

ALTER TABLE "chapters" ADD CONSTRAINT "chapters_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "events" ADD COLUMN "ref" TEXT,
ADD COLUMN "chapter_id" INTEGER;

CREATE UNIQUE INDEX "events_ref_key" ON "events"("ref");

CREATE INDEX "events_chapter_id_idx" ON "events"("chapter_id");

ALTER TABLE "events" ADD CONSTRAINT "events_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
