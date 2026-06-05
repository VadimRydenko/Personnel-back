-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "temp_password" TEXT,
    "password_changed_at" TIMESTAMP(3),
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "block_reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "employee_code" INTEGER,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "password" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" SERIAL NOT NULL,
    "roleName" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role" (
    "userId" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_permission" (
    "groupId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "group_permission_pkey" PRIMARY KEY ("groupId","permissionId")
);

-- CreateTable
CREATE TABLE "user_group" (
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "user_group_pkey" PRIMARY KEY ("userId","groupId")
);

-- CreateTable
CREATE TABLE "user_permission" (
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "user_permission_pkey" PRIMARY KEY ("userId","permissionId")
);

-- CreateTable
CREATE TABLE "dorder" (
    "code" SERIAL NOT NULL,
    "val" TEXT NOT NULL,

    CONSTRAINT "dorder_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "orders" (
    "code" SERIAL NOT NULL,
    "order_whose" INTEGER NOT NULL,
    "order_no" VARCHAR(10) NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "dnationality" (
    "code" SERIAL NOT NULL,
    "val" VARCHAR(20) NOT NULL,

    CONSTRAINT "dnationality_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "dwherefree" (
    "code" SERIAL NOT NULL,
    "val" VARCHAR(100) NOT NULL,

    CONSTRAINT "dwherefree_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "dfamilymode" (
    "code" SERIAL NOT NULL,
    "val" VARCHAR(20) NOT NULL,

    CONSTRAINT "dfamilymode_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "dunit" (
    "code" SERIAL NOT NULL,
    "val" TEXT NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "dunit_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "dplace" (
    "code" SERIAL NOT NULL,
    "val" TEXT NOT NULL,

    CONSTRAINT "dplace_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "units" (
    "code" SERIAL NOT NULL,
    "parent" INTEGER,
    "unit" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "short_name" TEXT,
    "city" TEXT NOT NULL DEFAULT '',
    "unit_id" INTEGER NOT NULL,
    "create_date" DATE NOT NULL,
    "destroy_date" DATE,
    "create_order" INTEGER NOT NULL,
    "destroy_order" INTEGER,
    "stationing" VARCHAR(100) NOT NULL DEFAULT 'Нема даних',

    CONSTRAINT "units_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "places" (
    "code" SERIAL NOT NULL,
    "unit" INTEGER NOT NULL,
    "place" INTEGER NOT NULL,
    "place_id" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL,
    "doubletariffrank" INTEGER NOT NULL DEFAULT 86,
    "postype" INTEGER NOT NULL,
    "tariffrate" SMALLINT NOT NULL DEFAULT 0,
    "pos_count" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "percentrate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_chief" BOOLEAN NOT NULL DEFAULT false,
    "man_count" SMALLINT NOT NULL DEFAULT 0,
    "create_date" DATE NOT NULL,
    "destroy_date" DATE,
    "create_order" INTEGER NOT NULL,
    "destroy_order" INTEGER,
    "unitrevision" INTEGER,

    CONSTRAINT "places_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "employee" (
    "code" SERIAL NOT NULL,
    "lastname" VARCHAR(30) NOT NULL,
    "signature" VARCHAR(30) NOT NULL,
    "firstname" VARCHAR(20) NOT NULL,
    "middlename" VARCHAR(20) NOT NULL,
    "bornplace" VARCHAR(100) NOT NULL DEFAULT 'Нема даних',
    "birthday" DATE,
    "personalno" CHAR(8),
    "nationality" INTEGER NOT NULL,
    "sex" CHAR(1) NOT NULL DEFAULT 'Ч',
    "idno" CHAR(10),
    "fromwhere" INTEGER NOT NULL,
    "scilevel" VARCHAR(50),
    "scirank" VARCHAR(50),
    "vondate" DATE,
    "vlastcalced" DATE,
    "familymode" INTEGER NOT NULL,
    "homeaddress" VARCHAR(100) NOT NULL DEFAULT 'Нема даних',
    "fromdate" DATE,
    "todate" DATE NOT NULL DEFAULT '2999-12-31'::date,
    "last_rank" INTEGER,
    "last_place" INTEGER,
    "last_beginwork" INTEGER,
    "last_education" INTEGER,
    "last_mary" INTEGER,
    "remarks" TEXT,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Інше',
    "type_label" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "employee_code" INTEGER NOT NULL,
    "place_code" INTEGER,
    "employee_place_code" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_places" (
    "code" SERIAL NOT NULL,
    "employee" INTEGER NOT NULL,
    "place" INTEGER,
    "splace" VARCHAR(100) NOT NULL DEFAULT '',
    "whatorder" INTEGER NOT NULL,
    "fromdate" DATE NOT NULL,
    "todate" DATE NOT NULL DEFAULT '2999-12-31'::date,
    "koef" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "percentrate" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "fullname" VARCHAR(1000) NOT NULL,
    "byreasonof_unitrename" CHAR(1) NOT NULL DEFAULT 'F',
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employee_places_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_employee_code_key" ON "user"("employee_code");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "role_roleName_key" ON "role"("roleName");

-- CreateIndex
CREATE INDEX "user_role_roleId_idx" ON "user_role"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "group_slug_key" ON "group"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "permission_code_key" ON "permission"("code");

-- CreateIndex
CREATE INDEX "group_permission_permissionId_idx" ON "group_permission"("permissionId");

-- CreateIndex
CREATE INDEX "user_group_groupId_idx" ON "user_group"("groupId");

-- CreateIndex
CREATE INDEX "user_permission_permissionId_idx" ON "user_permission"("permissionId");

-- CreateIndex
CREATE INDEX "orders_order_whose_idx" ON "orders"("order_whose");

-- CreateIndex
CREATE INDEX "orders_order_date_idx" ON "orders"("order_date");

-- CreateIndex
CREATE UNIQUE INDEX "orders_struct" ON "orders"("order_date", "order_no", "order_whose");

-- CreateIndex
CREATE UNIQUE INDEX "dnationality_val_key" ON "dnationality"("val");

-- CreateIndex
CREATE UNIQUE INDEX "dwherefree_val_key" ON "dwherefree"("val");

-- CreateIndex
CREATE UNIQUE INDEX "dfamilymode_val_key" ON "dfamilymode"("val");

-- CreateIndex
CREATE UNIQUE INDEX "dunit_val_key" ON "dunit"("val");

-- CreateIndex
CREATE UNIQUE INDEX "dplace_val_key" ON "dplace"("val");

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

-- CreateIndex
CREATE UNIQUE INDEX "employee_idno_key" ON "employee"("idno");

-- CreateIndex
CREATE UNIQUE INDEX "employee_last_place_key" ON "employee"("last_place");

-- CreateIndex
CREATE INDEX "employee_lastname_idx" ON "employee"("lastname");

-- CreateIndex
CREATE INDEX "employee_firstname_idx" ON "employee"("firstname");

-- CreateIndex
CREATE INDEX "employee_middlename_idx" ON "employee"("middlename");

-- CreateIndex
CREATE INDEX "employee_signature_idx" ON "employee"("signature");

-- CreateIndex
CREATE INDEX "employee_fromdate_idx" ON "employee"("fromdate");

-- CreateIndex
CREATE INDEX "employee_todate_idx" ON "employee"("todate");

-- CreateIndex
CREATE INDEX "employee_last_rank_idx" ON "employee"("last_rank");

-- CreateIndex
CREATE INDEX "employee_last_place_idx" ON "employee"("last_place");

-- CreateIndex
CREATE INDEX "employee_last_beginwork_idx" ON "employee"("last_beginwork");

-- CreateIndex
CREATE INDEX "employee_lastname_firstname_middlename_idx" ON "employee"("lastname", "firstname", "middlename");

-- CreateIndex
CREATE INDEX "employee_fromdate_todate_idx" ON "employee"("fromdate", "todate");

-- CreateIndex
CREATE INDEX "document_status_idx" ON "document"("status");

-- CreateIndex
CREATE INDEX "document_date_idx" ON "document"("date");

-- CreateIndex
CREATE INDEX "document_employee_code_idx" ON "document"("employee_code");

-- CreateIndex
CREATE INDEX "document_place_code_idx" ON "document"("place_code");

-- CreateIndex
CREATE INDEX "document_employee_place_code_idx" ON "document"("employee_place_code");

-- CreateIndex
CREATE INDEX "employee_places_employee_idx" ON "employee_places"("employee");

-- CreateIndex
CREATE INDEX "employee_places_place_idx" ON "employee_places"("place");

-- CreateIndex
CREATE INDEX "employee_places_fromdate_idx" ON "employee_places"("fromdate");

-- CreateIndex
CREATE INDEX "employee_places_todate_idx" ON "employee_places"("todate");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_employee_code_fkey" FOREIGN KEY ("employee_code") REFERENCES "employee"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_permission" ADD CONSTRAINT "group_permission_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_permission" ADD CONSTRAINT "group_permission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_group" ADD CONSTRAINT "user_group_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_group" ADD CONSTRAINT "user_group_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission" ADD CONSTRAINT "user_permission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission" ADD CONSTRAINT "user_permission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_parent_fkey" FOREIGN KEY ("parent") REFERENCES "units"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_unit_fkey" FOREIGN KEY ("unit") REFERENCES "units"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_place_fkey" FOREIGN KEY ("place") REFERENCES "dplace"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_create_order_fkey" FOREIGN KEY ("create_order") REFERENCES "orders"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_destroy_order_fkey" FOREIGN KEY ("destroy_order") REFERENCES "orders"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_nationality_fkey" FOREIGN KEY ("nationality") REFERENCES "dnationality"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_fromwhere_fkey" FOREIGN KEY ("fromwhere") REFERENCES "dwherefree"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_familymode_fkey" FOREIGN KEY ("familymode") REFERENCES "dfamilymode"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_last_place_fkey" FOREIGN KEY ("last_place") REFERENCES "employee_places"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_employee_code_fkey" FOREIGN KEY ("employee_code") REFERENCES "employee"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_place_code_fkey" FOREIGN KEY ("place_code") REFERENCES "places"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_employee_place_code_fkey" FOREIGN KEY ("employee_place_code") REFERENCES "employee_places"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_places" ADD CONSTRAINT "employee_places_employee_fkey" FOREIGN KEY ("employee") REFERENCES "employee"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_places" ADD CONSTRAINT "employee_places_place_fkey" FOREIGN KEY ("place") REFERENCES "places"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_places" ADD CONSTRAINT "employee_places_whatorder_fkey" FOREIGN KEY ("whatorder") REFERENCES "orders"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

