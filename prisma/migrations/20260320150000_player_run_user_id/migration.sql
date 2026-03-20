-- Gắn run với Supabase Auth
ALTER TABLE "player_runs" ADD COLUMN "user_id" UUID;

CREATE INDEX "player_runs_user_id_idx" ON "player_runs"("user_id");
