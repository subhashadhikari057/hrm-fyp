-- CreateEnum
CREATE TYPE "RegularizationRequestType" AS ENUM ('MISSED_CHECKIN', 'MISSED_CHECKOUT', 'WRONG_TIME', 'FULL_DAY_EDIT');

-- CreateEnum
CREATE TYPE "RegularizationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "attendance_regularizations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "attendanceDayId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "requestType" "RegularizationRequestType" NOT NULL,
    "requestedCheckInTime" TIMESTAMP(3),
    "requestedCheckOutTime" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "status" "RegularizationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "beforeSnapshot" JSONB,
    "afterSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_regularizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_regularizations_companyId_employeeId_date_idx" ON "attendance_regularizations"("companyId", "employeeId", "date");

-- CreateIndex
CREATE INDEX "attendance_regularizations_status_date_idx" ON "attendance_regularizations"("status", "date");

-- AddForeignKey
ALTER TABLE "attendance_regularizations" ADD CONSTRAINT "attendance_regularizations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_regularizations" ADD CONSTRAINT "attendance_regularizations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_regularizations" ADD CONSTRAINT "attendance_regularizations_attendanceDayId_fkey" FOREIGN KEY ("attendanceDayId") REFERENCES "attendance_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_regularizations" ADD CONSTRAINT "attendance_regularizations_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
