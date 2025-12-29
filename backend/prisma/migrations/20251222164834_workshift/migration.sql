-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "workShiftId" TEXT;

-- CreateTable
CREATE TABLE "work_shifts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20),
    "description" TEXT,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_shifts_companyId_isActive_idx" ON "work_shifts"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "work_shifts_companyId_name_key" ON "work_shifts"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "work_shifts_companyId_code_key" ON "work_shifts"("companyId", "code");

-- CreateIndex
CREATE INDEX "employees_companyId_workShiftId_idx" ON "employees"("companyId", "workShiftId");

-- AddForeignKey
ALTER TABLE "work_shifts" ADD CONSTRAINT "work_shifts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_workShiftId_fkey" FOREIGN KEY ("workShiftId") REFERENCES "work_shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
