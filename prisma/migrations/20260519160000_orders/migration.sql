-- Довідник типів наказів (може вже існувати у legacy БД)
CREATE TABLE IF NOT EXISTS "dorder" (
    "code" SERIAL NOT NULL,
    "val" TEXT NOT NULL,

    CONSTRAINT "dorder_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "orders" (
    "code" SERIAL NOT NULL,
    "order_whose" INTEGER NOT NULL,
    "order_no" TEXT NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE INDEX "orders_order_whose_idx" ON "orders"("order_whose");

-- CreateIndex
CREATE INDEX "orders_order_date_idx" ON "orders"("order_date");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_order_whose_fkey" FOREIGN KEY ("order_whose") REFERENCES "dorder"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
