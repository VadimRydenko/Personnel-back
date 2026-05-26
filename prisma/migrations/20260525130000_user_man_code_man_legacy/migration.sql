-- User ↔ Man (legacy WEB_MEN.MAN)
ALTER TABLE "user" ADD COLUMN "man_code" INTEGER;

CREATE UNIQUE INDEX "user_man_code_key" ON "user"("man_code");

ALTER TABLE "user" ADD CONSTRAINT "user_man_code_fkey" FOREIGN KEY ("man_code") REFERENCES "man"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- MAN: індекси (idno unique + пошук по ПІБ / датах)
CREATE UNIQUE INDEX "man_idno_key" ON "man"("idno");
CREATE INDEX "man_lastname_idx" ON "man"("lastname");
CREATE INDEX "man_firstname_idx" ON "man"("firstname");
CREATE INDEX "man_middlename_idx" ON "man"("middlename");
CREATE INDEX "man_signature_idx" ON "man"("signature");
CREATE INDEX "man_fromdate_idx" ON "man"("fromdate");
CREATE INDEX "man_todate_idx" ON "man"("todate");
CREATE INDEX "man_last_rank_idx" ON "man"("last_rank");
CREATE INDEX "man_last_place_idx" ON "man"("last_place");
CREATE INDEX "man_last_beginwork_idx" ON "man"("last_beginwork");
