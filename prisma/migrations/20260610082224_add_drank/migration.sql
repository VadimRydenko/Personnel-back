-- AlterTable
ALTER TABLE "places" ALTER COLUMN "rank" DROP NOT NULL;

-- CreateTable
CREATE TABLE "drank" (
    "code" SERIAL NOT NULL,
    "val" TEXT NOT NULL,

    CONSTRAINT "drank_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "drank_val_key" ON "drank"("val");
