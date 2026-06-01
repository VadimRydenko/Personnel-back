-- Rename table man → employee
ALTER TABLE "man" RENAME TO "employee";

-- Rename FK column in manplaces: man → employee
ALTER TABLE "manplaces" RENAME COLUMN "man" TO "employee";

-- Rename FK column in user: man_code → employee_code
ALTER TABLE "user" RENAME COLUMN "man_code" TO "employee_code";
