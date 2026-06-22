/*
  Warnings:

  - Made the column `nationality` on table `employee` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "employee" ALTER COLUMN "nationality" SET NOT NULL;
