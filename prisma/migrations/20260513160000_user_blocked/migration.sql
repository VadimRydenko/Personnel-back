-- AlterTable
ALTER TABLE "user" ADD COLUMN "blocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user" ADD COLUMN "block_reason" TEXT;
