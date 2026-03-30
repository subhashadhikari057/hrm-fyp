-- CreateEnum
CREATE TYPE "CompensationChangeType" AS ENUM ('initial', 'increment', 'decrement', 'adjustment');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "allowances" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "isMarried" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "employee_compensation_history" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "previousBaseSalary" DOUBLE PRECISION,
    "newBaseSalary" DOUBLE PRECISION,
    "previousAllowances" DOUBLE PRECISION,
    "newAllowances" DOUBLE PRECISION,
    "changeType" "CompensationChangeType" NOT NULL DEFAULT 'adjustment',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedById" TEXT,
    "notes" TEXT,

    CONSTRAINT "employee_compensation_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_compensation_history_employeeId_changedAt_idx" ON "employee_compensation_history"("employeeId", "changedAt");

-- CreateIndex
CREATE INDEX "employee_compensation_history_companyId_changedAt_idx" ON "employee_compensation_history"("companyId", "changedAt");

-- AddForeignKey
ALTER TABLE "employee_compensation_history" ADD CONSTRAINT "employee_compensation_history_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_compensation_history" ADD CONSTRAINT "employee_compensation_history_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_compensation_history" ADD CONSTRAINT "employee_compensation_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
