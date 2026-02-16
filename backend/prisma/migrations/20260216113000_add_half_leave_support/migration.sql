-- CreateEnum
CREATE TYPE "HalfDaySession" AS ENUM ('FIRST_HALF', 'SECOND_HALF');

-- AlterTable
ALTER TABLE "leave_requests"
ADD COLUMN "isHalfDay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "halfDaySession" "HalfDaySession";
