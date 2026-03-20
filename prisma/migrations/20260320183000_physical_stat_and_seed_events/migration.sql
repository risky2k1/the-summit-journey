-- Chỉ thêm giá trị enum — phải tách khỏi seed vì PostgreSQL không cho dùng giá trị enum mới
-- trong cùng transaction với ALTER TYPE ... ADD VALUE (Prisma chạy mỗi file migration một transaction).
DO $e$ BEGIN
  ALTER TYPE "PlayerStat" ADD VALUE 'physical';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $e$;
