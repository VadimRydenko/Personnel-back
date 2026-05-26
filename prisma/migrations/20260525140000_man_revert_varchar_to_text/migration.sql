-- Повертаємо TEXT як у решті моделей (без VARCHAR обмежень)
ALTER TABLE "man" ALTER COLUMN "lastname" TYPE TEXT;
ALTER TABLE "man" ALTER COLUMN "signature" TYPE TEXT;
ALTER TABLE "man" ALTER COLUMN "firstname" TYPE TEXT;
ALTER TABLE "man" ALTER COLUMN "middlename" TYPE TEXT;
ALTER TABLE "man" ALTER COLUMN "bornplace" TYPE TEXT;
ALTER TABLE "man" ALTER COLUMN "homeaddress" TYPE TEXT;
ALTER TABLE "man" ALTER COLUMN "scilevel" TYPE TEXT;
ALTER TABLE "man" ALTER COLUMN "scirank" TYPE TEXT;
