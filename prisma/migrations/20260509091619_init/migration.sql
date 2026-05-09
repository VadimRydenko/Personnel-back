-- DropIndex
DROP INDEX "account_userId_key";

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");
