-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('normal', 'encounter', 'ending');

-- CreateEnum
CREATE TYPE "PlayerStat" AS ENUM ('tu_vi', 'karma', 'luck');

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "choices" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "next_event_id" INTEGER,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "choices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "choice_effects" (
    "id" SERIAL NOT NULL,
    "choice_id" INTEGER NOT NULL,
    "stat" "PlayerStat" NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "choice_effects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "choice_conditions" (
    "id" SERIAL NOT NULL,
    "choice_id" INTEGER NOT NULL,
    "stat" "PlayerStat" NOT NULL,
    "operator" VARCHAR(2) NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "choice_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_tags" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "event_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_runs" (
    "id" SERIAL NOT NULL,
    "current_event_id" INTEGER,
    "stats" JSONB NOT NULL DEFAULT '{}',
    "seed" TEXT NOT NULL,

    CONSTRAINT "player_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "run_history" (
    "id" SERIAL NOT NULL,
    "run_id" INTEGER NOT NULL,
    "event_id" INTEGER NOT NULL,
    "choice_id" INTEGER NOT NULL,

    CONSTRAINT "run_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_tags_event_id_tag_key" ON "event_tags"("event_id", "tag");

-- CreateIndex
CREATE INDEX "run_history_run_id_idx" ON "run_history"("run_id");

-- AddForeignKey
ALTER TABLE "choices" ADD CONSTRAINT "choices_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "choices" ADD CONSTRAINT "choices_next_event_id_fkey" FOREIGN KEY ("next_event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "choice_effects" ADD CONSTRAINT "choice_effects_choice_id_fkey" FOREIGN KEY ("choice_id") REFERENCES "choices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "choice_conditions" ADD CONSTRAINT "choice_conditions_choice_id_fkey" FOREIGN KEY ("choice_id") REFERENCES "choices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_tags" ADD CONSTRAINT "event_tags_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_runs" ADD CONSTRAINT "player_runs_current_event_id_fkey" FOREIGN KEY ("current_event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "run_history" ADD CONSTRAINT "run_history_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "player_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "run_history" ADD CONSTRAINT "run_history_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "run_history" ADD CONSTRAINT "run_history_choice_id_fkey" FOREIGN KEY ("choice_id") REFERENCES "choices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
