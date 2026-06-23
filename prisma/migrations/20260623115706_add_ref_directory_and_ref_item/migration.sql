-- CreateTable
CREATE TABLE "ref_directory" (
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ref_directory_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ref_item" (
    "id" SERIAL NOT NULL,
    "directory_key" TEXT NOT NULL,
    "val" TEXT NOT NULL,

    CONSTRAINT "ref_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ref_item_directory_key_idx" ON "ref_item"("directory_key");

-- AddForeignKey
ALTER TABLE "ref_item" ADD CONSTRAINT "ref_item_directory_key_fkey" FOREIGN KEY ("directory_key") REFERENCES "ref_directory"("key") ON DELETE CASCADE ON UPDATE CASCADE;
