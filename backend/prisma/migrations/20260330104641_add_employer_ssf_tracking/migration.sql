-- AlterTable
ALTER TABLE "payslips" ADD COLUMN     "ssfEmployerContribution" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalSsfContribution" DOUBLE PRECISION NOT NULL DEFAULT 0;
