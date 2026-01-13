-- CreateEnum
CREATE TYPE "NoticeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NoticePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- CreateEnum
CREATE TYPE "NoticeAudienceType" AS ENUM ('DEPARTMENT', 'DESIGNATION', 'EMPLOYEE', 'ROLE', 'WORK_SHIFT');

-- CreateTable
CREATE TABLE "notices" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "bannerUrl" TEXT,
    "priority" "NoticePriority" NOT NULL DEFAULT 'NORMAL',
    "status" "NoticeStatus" NOT NULL DEFAULT 'DRAFT',
    "publishAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isCompanyWide" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notice_audiences" (
    "id" TEXT NOT NULL,
    "noticeId" TEXT NOT NULL,
    "type" "NoticeAudienceType" NOT NULL,
    "departmentId" TEXT,
    "designationId" TEXT,
    "employeeId" TEXT,
    "role" "UserRole",
    "workShiftId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notice_audiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notice_reads" (
    "id" TEXT NOT NULL,
    "noticeId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notice_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notices_companyId_status_idx" ON "notices"("companyId", "status");

-- CreateIndex
CREATE INDEX "notices_companyId_publishAt_idx" ON "notices"("companyId", "publishAt");

-- CreateIndex
CREATE INDEX "notice_audiences_type_departmentId_idx" ON "notice_audiences"("type", "departmentId");

-- CreateIndex
CREATE INDEX "notice_audiences_type_designationId_idx" ON "notice_audiences"("type", "designationId");

-- CreateIndex
CREATE INDEX "notice_audiences_type_employeeId_idx" ON "notice_audiences"("type", "employeeId");

-- CreateIndex
CREATE INDEX "notice_audiences_type_role_idx" ON "notice_audiences"("type", "role");

-- CreateIndex
CREATE INDEX "notice_audiences_type_workShiftId_idx" ON "notice_audiences"("type", "workShiftId");

-- CreateIndex
CREATE INDEX "notice_reads_employeeId_readAt_idx" ON "notice_reads"("employeeId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "notice_reads_noticeId_employeeId_key" ON "notice_reads"("noticeId", "employeeId");

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice_audiences" ADD CONSTRAINT "notice_audiences_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "notices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice_audiences" ADD CONSTRAINT "notice_audiences_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice_audiences" ADD CONSTRAINT "notice_audiences_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "designations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice_audiences" ADD CONSTRAINT "notice_audiences_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice_audiences" ADD CONSTRAINT "notice_audiences_workShiftId_fkey" FOREIGN KEY ("workShiftId") REFERENCES "work_shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice_reads" ADD CONSTRAINT "notice_reads_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "notices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice_reads" ADD CONSTRAINT "notice_reads_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
