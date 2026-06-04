-- Add soft delete to employee_places
ALTER TABLE "employee_places" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- Create document table with proper FK references
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Інше',
    "type_label" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "employee_code" INTEGER NOT NULL,
    "employee_place_code" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- FK: document → employee
ALTER TABLE "document" ADD CONSTRAINT "document_employee_code_fkey"
    FOREIGN KEY ("employee_code") REFERENCES "employee"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- FK: document → employee_places
ALTER TABLE "document" ADD CONSTRAINT "document_employee_place_code_fkey"
    FOREIGN KEY ("employee_place_code") REFERENCES "employee_places"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "document_status_idx" ON "document"("status");
CREATE INDEX "document_date_idx" ON "document"("date");
CREATE INDEX "document_employee_code_idx" ON "document"("employee_code");
CREATE INDEX "document_employee_place_code_idx" ON "document"("employee_place_code");
