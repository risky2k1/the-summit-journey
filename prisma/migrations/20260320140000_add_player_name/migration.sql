-- Thêm tên nhân vật cho run (MVP: tạo nhân vật)
ALTER TABLE "player_runs" ADD COLUMN "player_name" VARCHAR(64) NOT NULL DEFAULT '';
