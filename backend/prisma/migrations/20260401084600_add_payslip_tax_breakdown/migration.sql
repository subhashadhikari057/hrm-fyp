-- AlterTable
ALTER TABLE "payslips" ADD COLUMN     "taxBreakdown" JSONB,
ADD COLUMN     "tdsComputation" JSONB;
