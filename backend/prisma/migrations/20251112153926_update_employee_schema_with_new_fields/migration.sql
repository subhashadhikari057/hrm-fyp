/*
  Warnings:

  - You are about to alter the column `firstName` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `VarChar(80)`.
  - You are about to alter the column `lastName` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `VarChar(80)`.
  - The `gender` column on the `employees` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `baseSalary` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" VARCHAR(20),
ADD COLUMN     "locationId" TEXT,
ADD COLUMN     "middleName" VARCHAR(80),
ADD COLUMN     "personalEmail" TEXT,
ADD COLUMN     "probationEnd" TIMESTAMP(3),
ADD COLUMN     "workEmail" TEXT,
ALTER COLUMN "firstName" SET DATA TYPE VARCHAR(80),
ALTER COLUMN "lastName" SET DATA TYPE VARCHAR(80),
DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender",
ALTER COLUMN "baseSalary" SET DATA TYPE DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "employees_companyId_idx" ON "employees"("companyId");
