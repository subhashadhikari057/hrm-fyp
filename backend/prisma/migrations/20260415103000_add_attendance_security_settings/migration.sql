-- AlterTable
ALTER TABLE "companies"
ADD COLUMN "attendanceIpRestrictionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "attendanceAllowedIpRanges" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "attendanceGeoRestrictionEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "officeLatitude" DOUBLE PRECISION,
ADD COLUMN "officeLongitude" DOUBLE PRECISION,
ADD COLUMN "officeRadiusMeters" INTEGER DEFAULT 150;
