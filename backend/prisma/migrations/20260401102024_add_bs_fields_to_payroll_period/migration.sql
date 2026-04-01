-- AlterTable
ALTER TABLE "payroll_periods" ADD COLUMN     "bsEndDate" VARCHAR(20),
ADD COLUMN     "bsPeriodMonth" INTEGER,
ADD COLUMN     "bsPeriodMonthLabel" VARCHAR(30),
ADD COLUMN     "bsPeriodYear" INTEGER,
ADD COLUMN     "bsStartDate" VARCHAR(20);
