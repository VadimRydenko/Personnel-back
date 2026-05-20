-- Довідник підрозділів (може вже існувати у legacy БД)
CREATE TABLE IF NOT EXISTS "dunit" (
    "code" SERIAL NOT NULL,
    "val" TEXT NOT NULL,
    "val_genitive" TEXT NOT NULL,

    CONSTRAINT "dunit_pkey" PRIMARY KEY ("code")
);

CREATE UNIQUE INDEX IF NOT EXISTS "dunit_val_key" ON "dunit"("val");

-- Довідник посад (може вже існувати у legacy БД)
CREATE TABLE IF NOT EXISTS "dplace" (
    "code" SERIAL NOT NULL,
    "val" TEXT NOT NULL,

    CONSTRAINT "dplace_pkey" PRIMARY KEY ("code")
);

CREATE UNIQUE INDEX IF NOT EXISTS "dplace_val_key" ON "dplace"("val");

-- CreateTable
CREATE TABLE "units" (
    "code" SERIAL NOT NULL,
    "parent" INTEGER,
    "unit" INTEGER NOT NULL,
    "unit_id" INTEGER NOT NULL,
    "create_date" DATE NOT NULL,
    "destroy_date" DATE,
    "create_order" INTEGER NOT NULL,
    "destroy_order" INTEGER,
    "stationing" TEXT NOT NULL DEFAULT 'Нема даних',

    CONSTRAINT "units_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "places" (
    "code" SERIAL NOT NULL,
    "unit" INTEGER NOT NULL,
    "place" INTEGER NOT NULL,
    "place_id" INTEGER NOT NULL DEFAULT 0,
    "pos_count" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "is_chief" BOOLEAN NOT NULL DEFAULT false,
    "man_count" INTEGER NOT NULL DEFAULT 0,
    "create_date" DATE NOT NULL,
    "destroy_date" DATE,
    "create_order" INTEGER NOT NULL,
    "destroy_order" INTEGER,

    CONSTRAINT "places_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE INDEX "units_parent_idx" ON "units"("parent");

-- CreateIndex
CREATE INDEX "units_parent_unit_id_idx" ON "units"("parent", "unit_id");

-- CreateIndex
CREATE INDEX "units_create_date_destroy_date_idx" ON "units"("create_date", "destroy_date");

-- CreateIndex
CREATE INDEX "places_unit_idx" ON "places"("unit");

-- CreateIndex
CREATE INDEX "places_unit_place_id_idx" ON "places"("unit", "place_id");

-- CreateIndex
CREATE INDEX "places_create_date_destroy_date_idx" ON "places"("create_date", "destroy_date");

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_parent_fkey" FOREIGN KEY ("parent") REFERENCES "units"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_unit_fkey" FOREIGN KEY ("unit") REFERENCES "dunit"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_create_order_fkey" FOREIGN KEY ("create_order") REFERENCES "orders"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_destroy_order_fkey" FOREIGN KEY ("destroy_order") REFERENCES "orders"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_unit_fkey" FOREIGN KEY ("unit") REFERENCES "units"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_place_fkey" FOREIGN KEY ("place") REFERENCES "dplace"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_create_order_fkey" FOREIGN KEY ("create_order") REFERENCES "orders"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_destroy_order_fkey" FOREIGN KEY ("destroy_order") REFERENCES "orders"("code") ON DELETE SET NULL ON UPDATE CASCADE;
