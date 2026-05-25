-- CreateTable
CREATE TABLE "man" (
    "code" SERIAL NOT NULL,
    "lastname" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "middlename" TEXT NOT NULL,
    "bornplace" TEXT NOT NULL DEFAULT 'Нема даних',
    "birthday" DATE,
    "personalno" CHAR(8),
    "nationality" INTEGER NOT NULL,
    "sex" CHAR(1) NOT NULL DEFAULT 'Ч',
    "idno" CHAR(10),
    "fromwhere" INTEGER NOT NULL,
    "scilevel" TEXT,
    "scirank" TEXT,
    "vondate" DATE,
    "vlastcalced" DATE,
    "familymode" INTEGER NOT NULL,
    "homeaddress" TEXT NOT NULL DEFAULT 'Нема даних',
    "fromdate" DATE,
    "todate" DATE NOT NULL DEFAULT '2999-12-31'::date,
    "last_rank" INTEGER,
    "last_place" INTEGER,
    "last_beginwork" INTEGER,
    "last_education" INTEGER,
    "last_mary" INTEGER,
    "remarks" TEXT,

    CONSTRAINT "man_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "manplaces" (
    "code" SERIAL NOT NULL,
    "man" INTEGER NOT NULL,
    "place" INTEGER,
    "splace" TEXT NOT NULL DEFAULT '',
    "whatorder" INTEGER NOT NULL,
    "fromdate" DATE NOT NULL,
    "todate" DATE NOT NULL DEFAULT '2999-12-31'::date,
    "koef" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "percentrate" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "fullname" TEXT NOT NULL,
    "byreasonof_unitrename" CHAR(1) NOT NULL DEFAULT 'F',

    CONSTRAINT "manplaces_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "man_last_place_key" ON "man"("last_place");

-- CreateIndex
CREATE INDEX "man_lastname_firstname_middlename_idx" ON "man"("lastname", "firstname", "middlename");

-- CreateIndex
CREATE INDEX "man_fromdate_todate_idx" ON "man"("fromdate", "todate");

-- CreateIndex
CREATE INDEX "manplaces_man_idx" ON "manplaces"("man");

-- CreateIndex
CREATE INDEX "manplaces_place_idx" ON "manplaces"("place");

-- CreateIndex
CREATE INDEX "manplaces_fromdate_idx" ON "manplaces"("fromdate");

-- CreateIndex
CREATE INDEX "manplaces_todate_idx" ON "manplaces"("todate");

-- AddForeignKey
ALTER TABLE "man" ADD CONSTRAINT "man_last_place_fkey" FOREIGN KEY ("last_place") REFERENCES "manplaces"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manplaces" ADD CONSTRAINT "manplaces_man_fkey" FOREIGN KEY ("man") REFERENCES "man"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manplaces" ADD CONSTRAINT "manplaces_place_fkey" FOREIGN KEY ("place") REFERENCES "places"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manplaces" ADD CONSTRAINT "manplaces_whatorder_fkey" FOREIGN KEY ("whatorder") REFERENCES "orders"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddConstraint
ALTER TABLE "manplaces" ADD CONSTRAINT "manplaces_byreasonof_unitrename_check" CHECK ("byreasonof_unitrename" IN ('F', 'T'));

-- AddConstraint
ALTER TABLE "manplaces" ADD CONSTRAINT "manplaces_koef_check" CHECK ("koef" >= 1);

-- AddConstraint
ALTER TABLE "manplaces" ADD CONSTRAINT "manplaces_dates_check" CHECK ("todate" >= "fromdate");

-- AddConstraint
ALTER TABLE "manplaces" ADD CONSTRAINT "manplaces_percentrate_check" CHECK ("percentrate" <= 1);
