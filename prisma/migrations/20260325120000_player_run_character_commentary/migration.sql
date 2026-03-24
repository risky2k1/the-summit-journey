-- Lời thiên cơ (OpenRouter), cache sau lần sinh đầu — không chặn POST /api/run/start.
ALTER TABLE "player_runs" ADD COLUMN "character_commentary" TEXT;
