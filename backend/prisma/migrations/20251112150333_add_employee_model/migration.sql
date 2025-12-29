-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('active', 'on_leave', 'terminated');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('full_time', 'part_time', 'contract', 'intern');

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "departmentId" TEXT,
    "designationId" TEXT,
    "gender" VARCHAR(20),
    "dateOfBirth" TIMESTAMP(3),
    "joinDate" TIMESTAMP(3),
    "phone" VARCHAR(20),
    "address" TEXT,
    "baseSalary" DECIMAL(10,2),
    "employmentType" "EmploymentType",
    "status" "EmployeeStatus" NOT NULL DEFAULT 'active',
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- CreateIndex
CREATE INDEX "employees_companyId_status_idx" ON "employees"("companyId", "status");

-- CreateIndex
CREATE INDEX "employees_companyId_departmentId_idx" ON "employees"("companyId", "departmentId");

-- CreateIndex
CREATE INDEX "employees_companyId_designationId_idx" ON "employees"("companyId", "designationId");

-- CreateIndex
CREATE INDEX "employees_companyId_employmentType_idx" ON "employees"("companyId", "employmentType");

-- CreateIndex
CREATE UNIQUE INDEX "employees_companyId_employeeCode_key" ON "employees"("companyId", "employeeCode");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "designations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
