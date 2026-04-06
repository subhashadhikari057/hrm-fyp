-- CreateEnum
CREATE TYPE "PayrollPeriodStatus" AS ENUM ('DRAFT', 'PROCESSED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "PayslipStatus" AS ENUM ('GENERATED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "PayslipLineItemType" AS ENUM ('EARNING', 'DEDUCTION');

-- CreateTable
CREATE TABLE "payroll_periods" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fiscalYearLabel" VARCHAR(20) NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodLabel" VARCHAR(50) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PayrollPeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "processedAt" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3),
    "finalizedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" TEXT NOT NULL,
    "payrollPeriodId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" "PayslipStatus" NOT NULL DEFAULT 'GENERATED',
    "basicSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allowances" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ssfEmployeeContribution" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "projectedAnnualIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxableAnnualIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "annualTaxLiability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxPaidToDate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyTds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isMarried" BOOLEAN NOT NULL DEFAULT false,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslip_line_items" (
    "id" TEXT NOT NULL,
    "payslipId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "PayslipLineItemType" NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payslip_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payroll_periods_companyId_fiscalYearLabel_idx" ON "payroll_periods"("companyId", "fiscalYearLabel");

-- CreateIndex
CREATE INDEX "payroll_periods_companyId_status_idx" ON "payroll_periods"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_periods_companyId_periodYear_periodMonth_key" ON "payroll_periods"("companyId", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "payslips_companyId_employeeId_idx" ON "payslips"("companyId", "employeeId");

-- CreateIndex
CREATE INDEX "payslips_companyId_status_idx" ON "payslips"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_payrollPeriodId_employeeId_key" ON "payslips"("payrollPeriodId", "employeeId");

-- CreateIndex
CREATE INDEX "payslip_line_items_payslipId_sortOrder_idx" ON "payslip_line_items"("payslipId", "sortOrder");

-- CreateIndex
CREATE INDEX "payslip_line_items_companyId_type_idx" ON "payslip_line_items"("companyId", "type");

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_finalizedById_fkey" FOREIGN KEY ("finalizedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "payroll_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip_line_items" ADD CONSTRAINT "payslip_line_items_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "payslips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip_line_items" ADD CONSTRAINT "payslip_line_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
