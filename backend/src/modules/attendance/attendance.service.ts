import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginationMeta, getPagination } from '../../common/utils/pagination.util';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { FilterAttendanceDto } from './dto/filter-attendance.dto';
import {
  ManualAttendanceDto,
  UpdateAttendanceDto,
} from './dto/manual-attendance.dto';
import { ImportAttendanceSummaryDto } from './dto/import-attendance.dto';

const DEFAULT_GRACE_MINUTES = 30;
const DEFAULT_BREAK_MINUTES = 0;
const DEFAULT_HALF_DAY_MINUTES = 240;
const DEFAULT_EARLY_CHECK_IN_MINUTES = 30;
const KATHMANDU_OFFSET_MINUTES = 345;
const KATHMANDU_OFFSET_MS = KATHMANDU_OFFSET_MINUTES * 60000;

function toKathmanduDate(date: Date): Date {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utcMs + KATHMANDU_OFFSET_MS);
}

function getKathmanduStartOfDay(date: Date): Date {
  const ktm = toKathmanduDate(date);
  const utcMidnightKtm =
    Date.UTC(ktm.getUTCFullYear(), ktm.getUTCMonth(), ktm.getUTCDate(), 0, 0, 0, 0) -
    KATHMANDU_OFFSET_MS;
  return new Date(utcMidnightKtm);
}

function diffMinutes(a: Date, b: Date): number {
  return Math.max(0, Math.round((a.getTime() - b.getTime()) / 60000));
}

function alignShiftTimeToDate(baseDate: Date, shiftTime: Date): Date {
  return new Date(
    Date.UTC(
      baseDate.getUTCFullYear(),
      baseDate.getUTCMonth(),
      baseDate.getUTCDate(),
      shiftTime.getUTCHours(),
      shiftTime.getUTCMinutes(),
      shiftTime.getUTCSeconds(),
      shiftTime.getUTCMilliseconds(),
    ),
  );
}

function resolveShiftWindow(baseDate: Date, shiftStart: Date, shiftEnd: Date) {
  const shiftStartToday = alignShiftTimeToDate(baseDate, shiftStart);
  let shiftEndToday = alignShiftTimeToDate(baseDate, shiftEnd);

  const isOvernight = shiftEndToday <= shiftStartToday;
  if (isOvernight) {
    shiftEndToday = new Date(shiftEndToday.getTime() + 24 * 60 * 60 * 1000);
  }

  let shiftStartForNow = shiftStartToday;
  let shiftEndForNow = shiftEndToday;

  if (isOvernight && baseDate < shiftStartToday) {
    const shiftStartYesterday = new Date(shiftStartToday.getTime() - 24 * 60 * 60 * 1000);
    const shiftEndYesterday = new Date(shiftEndToday.getTime() - 24 * 60 * 60 * 1000);
    if (baseDate >= shiftStartYesterday && baseDate <= shiftEndYesterday) {
      shiftStartForNow = shiftStartYesterday;
      shiftEndForNow = shiftEndYesterday;
    }
  }

  return { shiftStartToday, shiftEndToday, shiftStartForNow, shiftEndForNow };
}

function computeAttendanceMetrics(params: {
  checkIn?: Date | null;
  checkOut?: Date | null;
  shiftStart?: Date | null;
  shiftEnd?: Date | null;
  graceMinutes?: number;
  breakMinutes?: number;
  halfDayMinutes?: number;
}) {
  const {
    checkIn,
    checkOut,
    shiftStart,
    shiftEnd,
    graceMinutes = DEFAULT_GRACE_MINUTES,
    breakMinutes = DEFAULT_BREAK_MINUTES,
    halfDayMinutes = DEFAULT_HALF_DAY_MINUTES,
  } = params;

  const baseDate = toKathmanduDate(checkIn ?? checkOut ?? new Date());
  const shiftWindow =
    shiftStart && shiftEnd ? resolveShiftWindow(baseDate, shiftStart, shiftEnd) : null;

  if (!checkIn || !shiftWindow) {
    return {
      totalWorkMinutes: 0,
      lateMinutes: 0,
      overtimeMinutes: 0,
      status: 'ABSENT' as const,
    };
  }

  if (!checkOut) {
    // Checked-in but not checked-out yet
    const lateStart = new Date(
      shiftWindow.shiftStartForNow.getTime() + graceMinutes * 60000,
    );
    const checkInKtm = toKathmanduDate(checkIn);
    const lateMinutes =
      checkInKtm.getTime() > lateStart.getTime()
        ? diffMinutes(checkInKtm, shiftWindow.shiftStartForNow)
        : 0;
    return {
      totalWorkMinutes: 0,
      lateMinutes,
      overtimeMinutes: 0,
      status: lateMinutes > 0 ? ('LATE' as const) : ('PRESENT' as const),
    };
  }

  const rawMinutes = diffMinutes(toKathmanduDate(checkOut), toKathmanduDate(checkIn));
  const totalWorkMinutes = Math.max(0, rawMinutes - breakMinutes);

  const plannedMinutes =
    diffMinutes(shiftWindow.shiftEndForNow, shiftWindow.shiftStartForNow) - breakMinutes;

  const lateStart = new Date(
    shiftWindow.shiftStartForNow.getTime() + graceMinutes * 60000,
  );
  const checkInKtm = toKathmanduDate(checkIn);
  const lateMinutes =
    checkInKtm.getTime() > lateStart.getTime()
      ? diffMinutes(checkInKtm, shiftWindow.shiftStartForNow)
      : 0;

  let status: 'PRESENT' | 'LATE' | 'HALF_DAY' =
    lateMinutes > 0 ? 'LATE' : 'PRESENT';

  if (totalWorkMinutes < halfDayMinutes) {
    status = 'HALF_DAY';
  }

  const overtimeMinutes =
    plannedMinutes > 0 && totalWorkMinutes > plannedMinutes
      ? totalWorkMinutes - plannedMinutes
      : 0;

  return {
    totalWorkMinutes,
    lateMinutes,
    overtimeMinutes,
    status,
  };
}

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async resolveTargetEmployee(
    currentUser: { id: string; role: UserRole; companyId: string | null },
    explicitEmployeeId?: string,
  ) {
    const isCompanyLevel =
      currentUser.role === 'company_admin' ||
      currentUser.role === 'hr_manager' ||
      currentUser.role === 'manager';

    if (explicitEmployeeId) {
      // Trim and ignore empty strings coming from the client
      const cleanId = explicitEmployeeId.trim();

      // If not a company-level role, silently fall back to "self" attendance
      // so that employees cannot act on others, but can still check in.
      if (cleanId && isCompanyLevel) {
        const employee = await this.prisma.employee.findUnique({
          where: { id: cleanId },
        });

        if (!employee) {
          throw new NotFoundException(
            `Employee with ID "${cleanId}" not found`,
          );
        }

        if (currentUser.companyId && employee.companyId !== currentUser.companyId) {
          throw new ForbiddenException(
            'You can only manage attendance for employees in your own company',
          );
        }

        return employee;
      }
      // else: treat as self-attendance below
    }

    // Self (employee) attendance
    const employee = await this.prisma.employee.findFirst({
      where: { userId: currentUser.id },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found for current user');
    }

    if (currentUser.companyId && employee.companyId !== currentUser.companyId) {
      throw new ForbiddenException(
        'You can only manage attendance within your own company',
      );
    }

    return employee;
  }

  private async getEmployeeShift(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        workShift: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID "${employeeId}" not found`);
    }

    if (!employee.workShift) {
      throw new BadRequestException(
        'Employee does not have a work shift assigned',
      );
    }

    return employee.workShift;
  }

  /**
   * Check-in for current employee or a target employee (admin)
   */
  async checkIn(currentUser: any, dto: CheckInDto, meta: { ip?: string; userAgent?: string }) {
    const now = new Date();
    const today = getKathmanduStartOfDay(now);

    const employee = await this.resolveTargetEmployee(
      currentUser,
      dto.employeeId,
    );

    const shift = await this.getEmployeeShift(employee.id);
    const nowKtm = toKathmanduDate(now);
    const shiftWindow = resolveShiftWindow(nowKtm, shift.startTime, shift.endTime);
    const earliestCheckIn = new Date(
      shiftWindow.shiftStartForNow.getTime() - DEFAULT_EARLY_CHECK_IN_MINUTES * 60000,
    );

    if (nowKtm < earliestCheckIn) {
      throw new BadRequestException(
        `Check-in is allowed only within ${DEFAULT_EARLY_CHECK_IN_MINUTES} minutes before shift start`,
      );
    }

    // Ensure no multiple check-ins for the same day
    const existing = await (this.prisma as any).attendanceDay.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: today,
        },
      },
    });

    if (existing && existing.checkInTime) {
      throw new BadRequestException(
        'Employee has already checked in for today',
      );
    }

    const metrics = computeAttendanceMetrics({
      checkIn: now,
      shiftStart: shift.startTime,
      shiftEnd: shift.endTime,
    });

    const source = currentUser.id === employee.userId ? 'SELF' : 'ADMIN';

    const attendanceDay = await (this.prisma as any).attendanceDay.upsert({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: today,
        },
      },
      update: {
        checkInTime: now,
        status: metrics.status,
        lateMinutes: metrics.lateMinutes,
        totalWorkMinutes: metrics.totalWorkMinutes,
        overtimeMinutes: metrics.overtimeMinutes,
        workShiftId: shift.id,
        source,
        updatedById: currentUser.id,
      },
      create: {
        companyId: employee.companyId,
        employeeId: employee.id,
        workShiftId: shift.id,
        date: today,
        checkInTime: now,
        status: metrics.status,
        lateMinutes: metrics.lateMinutes,
        totalWorkMinutes: metrics.totalWorkMinutes,
        overtimeMinutes: metrics.overtimeMinutes,
        source,
        createdById: currentUser.id,
      },
    });

    await (this.prisma as any).attendanceLog.create({
      data: {
        companyId: employee.companyId,
        employeeId: employee.id,
        attendanceDayId: attendanceDay.id,
        timestamp: now,
        type: 'CHECK_IN',
        method: source === 'SELF' ? 'WEB' : 'ADMIN',
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });

    return {
      message: 'Check-in recorded successfully',
      data: attendanceDay,
    };
  }

  /**
   * Check-out for current employee or a target employee (admin)
   */
  async checkOut(
    currentUser: any,
    dto: CheckOutDto,
    meta: { ip?: string; userAgent?: string },
  ) {
    const now = new Date();
    const today = getKathmanduStartOfDay(now);

    const employee = await this.resolveTargetEmployee(
      currentUser,
      dto.employeeId,
    );

    const day = await (this.prisma as any).attendanceDay.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: today,
        },
      },
      include: {
        workShift: true,
      },
    });

    if (!day || !day.checkInTime) {
      throw new BadRequestException(
        'Cannot check-out before check-in for today',
      );
    }

    if (day.checkOutTime) {
      throw new BadRequestException(
        'Employee has already checked out for today',
      );
    }

    const shift = day.workShift ?? (await this.getEmployeeShift(employee.id));

    const metrics = computeAttendanceMetrics({
      checkIn: day.checkInTime,
      checkOut: now,
      shiftStart: shift.startTime,
      shiftEnd: shift.endTime,
    });

    const updated = await (this.prisma as any).attendanceDay.update({
      where: { id: day.id },
      data: {
        checkOutTime: now,
        totalWorkMinutes: metrics.totalWorkMinutes,
        lateMinutes: metrics.lateMinutes,
        overtimeMinutes: metrics.overtimeMinutes,
        status: metrics.status,
        updatedById: currentUser.id,
      },
    });

    await (this.prisma as any).attendanceLog.create({
      data: {
        companyId: employee.companyId,
        employeeId: employee.id,
        attendanceDayId: updated.id,
        timestamp: now,
        type: 'CHECK_OUT',
        method: currentUser.id === employee.userId ? 'WEB' : 'ADMIN',
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });

    return {
      message: 'Check-out recorded successfully',
      data: updated,
    };
  }

  /**
   * Get current employee attendance (self)
   */
  async getMyAttendance(
    currentUser: any,
    filter: Pick<FilterAttendanceDto, 'dateFrom' | 'dateTo' | 'page' | 'limit'>,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: currentUser.id },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found for current user');
    }

    const { dateFrom, dateTo, page = 1, limit = 10 } = filter;

    const where: any = {
      employeeId: employee.id,
    };

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = getKathmanduStartOfDay(dateFrom);
      if (dateTo) where.date.lte = getKathmanduStartOfDay(dateTo);
    }

    const { skip, take, page: currentPage, limit: currentLimit } = getPagination(page, limit);
    const total = await (this.prisma as any).attendanceDay.count({ where });

    const days = await (this.prisma as any).attendanceDay.findMany({
      where,
      skip,
      take,
      orderBy: { date: 'desc' },
      include: {
        workShift: {
          select: {
            id: true,
            name: true,
            code: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    return {
      message: 'Attendance retrieved successfully',
      data: days,
      meta: buildPaginationMeta(total, currentPage, currentLimit),
    };
  }

  /**
   * Admin/company attendance listing with filters
   */
  async findAll(currentUser: any, filter: FilterAttendanceDto) {
    if (!currentUser.companyId) {
      throw new ForbiddenException(
        'Company ID not found in token. This endpoint is only for company-level users.',
      );
    }

    const {
      employeeId,
      departmentId,
      designationId,
      shiftId,
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = filter;

    const where: any = {
      companyId: currentUser.companyId,
    };

    if (employeeId) where.employeeId = employeeId;
    if (shiftId) where.workShiftId = shiftId;
    if (status) where.status = status;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = getKathmanduStartOfDay(dateFrom);
      if (dateTo) where.date.lte = getKathmanduStartOfDay(dateTo);
    }

    if (departmentId || designationId) {
      where.employee = {};
      if (departmentId) where.employee.departmentId = departmentId;
      if (designationId) where.employee.designationId = designationId;
    }

    const { skip, take, page: currentPage, limit: currentLimit } = getPagination(page, limit);
    const total = await (this.prisma as any).attendanceDay.count({ where });

    const days = await (this.prisma as any).attendanceDay.findMany({
      where,
      skip,
      take,
      orderBy: { date: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            departmentId: true,
            designationId: true,
          },
        },
        workShift: {
          select: {
            id: true,
            name: true,
            code: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    return {
      message: 'Attendance records retrieved successfully',
      data: days,
      meta: buildPaginationMeta(total, currentPage, currentLimit),
    };
  }

  async findOne(currentUser: any, id: string) {
    if (!currentUser.companyId) {
      throw new ForbiddenException(
        'Company ID not found in token. This endpoint is only for company-level users.',
      );
    }

    const day = await (this.prisma as any).attendanceDay.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            departmentId: true,
            designationId: true,
          },
        },
        workShift: {
          select: {
            id: true,
            name: true,
            code: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!day) {
      throw new NotFoundException(`Attendance record with ID "${id}" not found`);
    }

    if (day.companyId !== currentUser.companyId) {
      throw new ForbiddenException(
        'You can only access attendance from your own company',
      );
    }

    return {
      message: 'Attendance record retrieved successfully',
      data: day,
    };
  }

  async createManual(currentUser: any, dto: ManualAttendanceDto) {
    if (!currentUser.companyId) {
      throw new ForbiddenException(
        'Company ID not found in token. This endpoint is only for company-level users.',
      );
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID "${dto.employeeId}" not found`);
    }

    if (employee.companyId !== currentUser.companyId) {
      throw new ForbiddenException(
        'You can only create attendance for employees in your own company',
      );
    }

    const date = getKathmanduStartOfDay(dto.date);

    const shift =
      dto.shiftId
        ? await this.prisma.workShift.findUnique({ where: { id: dto.shiftId } })
        : await this.getEmployeeShift(employee.id);

    if (!shift) {
      throw new NotFoundException('Work shift not found');
    }

    const metrics = computeAttendanceMetrics({
      checkIn: dto.checkInTime ?? null,
      checkOut: dto.checkOutTime ?? null,
      shiftStart: shift.startTime,
      shiftEnd: shift.endTime,
    });

    const status = dto.status ?? metrics.status;

    const day = await (this.prisma as any).attendanceDay.upsert({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date,
        },
      },
      update: {
        workShiftId: shift.id,
        checkInTime: dto.checkInTime,
        checkOutTime: dto.checkOutTime,
        totalWorkMinutes: metrics.totalWorkMinutes,
        lateMinutes: metrics.lateMinutes,
        overtimeMinutes: metrics.overtimeMinutes,
        status,
        notes: dto.notes,
        source: 'ADMIN',
        updatedById: currentUser.id,
      },
      create: {
        companyId: employee.companyId,
        employeeId: employee.id,
        workShiftId: shift.id,
        date,
        checkInTime: dto.checkInTime,
        checkOutTime: dto.checkOutTime,
        totalWorkMinutes: metrics.totalWorkMinutes,
        lateMinutes: metrics.lateMinutes,
        overtimeMinutes: metrics.overtimeMinutes,
        status,
        notes: dto.notes,
        source: 'ADMIN',
        createdById: currentUser.id,
      },
    });

    return {
      message: 'Attendance record saved successfully',
      data: day,
    };
  }

  async updateManual(currentUser: any, id: string, dto: UpdateAttendanceDto) {
    if (!currentUser.companyId) {
      throw new ForbiddenException(
        'Company ID not found in token. This endpoint is only for company-level users.',
      );
    }

    const existing = await (this.prisma as any).attendanceDay.findUnique({
      where: { id },
      include: {
        workShift: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Attendance record with ID "${id}" not found`);
    }

    if (existing.companyId !== currentUser.companyId) {
      throw new ForbiddenException(
        'You can only update attendance from your own company',
      );
    }

    const nextCheckIn = dto.checkInTime ?? existing.checkInTime;
    const nextCheckOut = dto.checkOutTime ?? existing.checkOutTime;

    const shift =
      existing.workShift ??
      (await this.getEmployeeShift(existing.employeeId));

    const metrics = computeAttendanceMetrics({
      checkIn: nextCheckIn ?? null,
      checkOut: nextCheckOut ?? null,
      shiftStart: shift.startTime,
      shiftEnd: shift.endTime,
    });

    const status = dto.status ?? metrics.status;

    const updated = await (this.prisma as any).attendanceDay.update({
      where: { id },
      data: {
        checkInTime: dto.checkInTime ?? existing.checkInTime,
        checkOutTime: dto.checkOutTime ?? existing.checkOutTime,
        totalWorkMinutes: metrics.totalWorkMinutes,
        lateMinutes: metrics.lateMinutes,
        overtimeMinutes: metrics.overtimeMinutes,
        status,
        notes: dto.notes ?? existing.notes,
        source: 'ADMIN',
        updatedById: currentUser.id,
      },
    });

    return {
      message: 'Attendance record updated successfully',
      data: updated,
    };
  }

  /**
   * CSV export helper - returns plain string
   */
  async exportCsv(currentUser: any, filter: FilterAttendanceDto): Promise<string> {
    const result = await this.findAll(currentUser, filter);
    const rows = result.data as any[];

    const header = [
      'employeeCode',
      'employeeId',
      'date',
      'status',
      'checkInTime',
      'checkOutTime',
      'totalWorkMinutes',
      'lateMinutes',
      'overtimeMinutes',
      'shiftName',
      'notes',
    ];

    const lines = [header.join(',')];

    for (const row of rows) {
      const values = [
        row.employee?.employeeCode ?? '',
        row.employeeId,
        row.date.toISOString(),
        row.status,
        row.checkInTime ? row.checkInTime.toISOString() : '',
        row.checkOutTime ? row.checkOutTime.toISOString() : '',
        row.totalWorkMinutes?.toString() ?? '0',
        row.lateMinutes?.toString() ?? '0',
        row.overtimeMinutes?.toString() ?? '0',
        row.workShift?.name ?? '',
        row.notes ? `"${String(row.notes).replace(/"/g, '""')}"` : '',
      ];
      lines.push(values.join(','));
    }

    return lines.join('\n');
  }

  /**
   * CSV import
   */
  async importCsv(
    currentUser: any,
    file: Express.Multer.File,
  ): Promise<{ message: string; data: ImportAttendanceSummaryDto }> {
    if (!currentUser.companyId) {
      throw new ForbiddenException(
        'Company ID not found in token. This endpoint is only for company-level users.',
      );
    }

    if (!file || !file.buffer) {
      throw new BadRequestException('CSV file is required');
    }

    const content = file.buffer.toString('utf-8');
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length <= 1) {
      return {
        message: 'No data rows found in CSV',
        data: {
          total: 0,
          successCount: 0,
          failCount: 0,
          errors: [],
        },
      };
    }

    const header = lines[0].split(',').map((h) => h.trim());

    const idxEmployeeCode = header.findIndex(
      (h) => h.toLowerCase() === 'employeecode',
    );
    const idxEmployeeEmail = header.findIndex(
      (h) => h.toLowerCase() === 'employeeemail',
    );
    const idxDate = header.findIndex((h) => h.toLowerCase() === 'date');
    const idxCheckIn = header.findIndex(
      (h) => h.toLowerCase() === 'checkintime',
    );
    const idxCheckOut = header.findIndex(
      (h) => h.toLowerCase() === 'checkouttime',
    );
    const idxShiftName = header.findIndex(
      (h) => h.toLowerCase() === 'shiftname',
    );
    const idxNotes = header.findIndex((h) => h.toLowerCase() === 'notes');

    if (idxDate === -1) {
      throw new BadRequestException(
        'CSV must contain at least the "date" column',
      );
    }

    if (idxEmployeeCode === -1 && idxEmployeeEmail === -1) {
      throw new BadRequestException(
        'CSV must contain either "employeeCode" or "employeeEmail" column',
      );
    }

    const summary: ImportAttendanceSummaryDto = {
      total: lines.length - 1,
      successCount: 0,
      failCount: 0,
      errors: [],
    };

    for (let i = 1; i < lines.length; i++) {
      const raw = lines[i];
      if (!raw.trim()) continue;

      const cols = raw.split(',');

      try {
        const employeeCode =
          idxEmployeeCode >= 0 ? cols[idxEmployeeCode]?.trim() : undefined;
        const employeeEmail =
          idxEmployeeEmail >= 0 ? cols[idxEmployeeEmail]?.trim() : undefined;
        const dateStr = cols[idxDate]?.trim();
        const checkInStr =
          idxCheckIn >= 0 ? cols[idxCheckIn]?.trim() : undefined;
        const checkOutStr =
          idxCheckOut >= 0 ? cols[idxCheckOut]?.trim() : undefined;
        const shiftName =
          idxShiftName >= 0 ? cols[idxShiftName]?.trim() : undefined;
        const notes = idxNotes >= 0 ? cols[idxNotes]?.trim() : undefined;

        if (!dateStr) {
          throw new Error('Missing date');
        }

        const date = getKathmanduStartOfDay(new Date(dateStr));

        let employee;
        if (employeeCode) {
          employee = await this.prisma.employee.findFirst({
            where: {
              companyId: currentUser.companyId,
              employeeCode,
            },
          });
        } else if (employeeEmail) {
          employee = await this.prisma.employee.findFirst({
            where: {
              companyId: currentUser.companyId,
              user: {
                email: employeeEmail,
              },
            },
            include: {
              user: true,
            },
          });
        }

        if (!employee) {
          throw new Error('Employee not found');
        }

        let shift = await this.getEmployeeShift(employee.id);
        if (shiftName) {
          const customShift = await this.prisma.workShift.findFirst({
            where: {
              companyId: currentUser.companyId,
              name: shiftName,
            },
          });
          if (customShift) {
            shift = customShift;
          }
        }

        const checkIn = checkInStr ? new Date(checkInStr) : undefined;
        const checkOut = checkOutStr ? new Date(checkOutStr) : undefined;

        const metrics = computeAttendanceMetrics({
          checkIn: checkIn ?? null,
          checkOut: checkOut ?? null,
          shiftStart: shift.startTime,
          shiftEnd: shift.endTime,
        });

        await this.prisma.$transaction(async (tx) => {
          const anyTx = tx as any;
          const day = await anyTx.attendanceDay.upsert({
            where: {
              employeeId_date: {
                employeeId: employee.id,
                date,
              },
            },
            update: {
              workShiftId: shift.id,
              checkInTime: checkIn,
              checkOutTime: checkOut,
              totalWorkMinutes: metrics.totalWorkMinutes,
              lateMinutes: metrics.lateMinutes,
              overtimeMinutes: metrics.overtimeMinutes,
              status: metrics.status as any,
              notes,
              source: 'IMPORT',
              updatedById: currentUser.id,
            },
            create: {
              companyId: employee.companyId,
              employeeId: employee.id,
              workShiftId: shift.id,
              date,
              checkInTime: checkIn,
              checkOutTime: checkOut,
              totalWorkMinutes: metrics.totalWorkMinutes,
              lateMinutes: metrics.lateMinutes,
              overtimeMinutes: metrics.overtimeMinutes,
              status: metrics.status as any,
              notes,
              source: 'IMPORT',
              createdById: currentUser.id,
            },
          });

          if (checkIn) {
            await anyTx.attendanceLog.create({
              data: {
                companyId: employee.companyId,
                employeeId: employee.id,
                attendanceDayId: day.id,
                timestamp: checkIn,
                type: 'CHECK_IN',
                method: 'IMPORT',
              },
            });
          }

          if (checkOut) {
            await anyTx.attendanceLog.create({
              data: {
                companyId: employee.companyId,
                employeeId: employee.id,
                attendanceDayId: day.id,
                timestamp: checkOut,
                type: 'CHECK_OUT',
                method: 'IMPORT',
              },
            });
          }
        });

        summary.successCount++;
      } catch (error: any) {
        summary.failCount++;
        summary.errors.push({
          row: i + 1,
          message: error?.message || 'Unknown error',
        });
      }
    }

    return {
      message: 'Attendance import completed',
      data: summary,
    };
  }

  /**
   * Mark absents for a given date (weekdays only)
   */
  async markAbsents(currentUser: any, date: Date) {
    if (!currentUser.companyId) {
      throw new ForbiddenException(
        'Company ID not found in token. This endpoint is only for company-level users.',
      );
    }

    const targetDate = getKathmanduStartOfDay(date);
    const dayOfWeek = targetDate.getUTCDay(); // 0 = Sunday, 6 = Saturday

    // Skip Saturday only
    if (dayOfWeek === 6) {
      return {
        message: 'Skipped absent marking for weekend',
        data: {
          created: 0,
          date: targetDate.toISOString(),
        },
      };
    }

    const created = await this.markAbsentsForCompanyId(
      currentUser.companyId,
      targetDate,
      currentUser.id,
    );

    return {
      message:
        created === 0
          ? 'No employees to mark absent for this date'
          : 'Absents marked successfully',
      data: {
        created,
        date: targetDate.toISOString(),
      },
    };
  }

  async markAbsentsForAllCompanies(date: Date): Promise<{
    skippedWeekend: boolean;
    date: string;
    companiesProcessed: number;
    created: number;
  }> {
    const targetDate = getKathmanduStartOfDay(date);
    const dayOfWeek = targetDate.getUTCDay(); // 0 = Sunday, 6 = Saturday

    // Skip Saturday only
    if (dayOfWeek === 6) {
      return {
        skippedWeekend: true,
        date: targetDate.toISOString(),
        companiesProcessed: 0,
        created: 0,
      };
    }

    const companies = await this.prisma.company.findMany({
      where: { status: 'active' },
      select: { id: true },
    });

    let totalCreated = 0;
    for (const company of companies) {
      totalCreated += await this.markAbsentsForCompanyId(
        company.id,
        targetDate,
        null,
      );
    }

    return {
      skippedWeekend: false,
      date: targetDate.toISOString(),
      companiesProcessed: companies.length,
      created: totalCreated,
    };
  }

  private async markAbsentsForCompanyId(
    companyId: string,
    targetDate: Date,
    createdById: string | null,
  ): Promise<number> {
    const activeEmployees = await this.prisma.employee.findMany({
      where: {
        companyId,
        status: 'active',
      },
      select: { id: true, companyId: true },
    });

    if (activeEmployees.length === 0) {
      return 0;
    }

    const existing = await (this.prisma as any).attendanceDay.findMany({
      where: {
        companyId,
        date: targetDate,
      },
      select: {
        employeeId: true,
      },
    });

    const existingEmployeeIds = new Set(existing.map((e) => e.employeeId));

    const toCreate = activeEmployees.filter(
      (e) => !existingEmployeeIds.has(e.id),
    );

    if (toCreate.length === 0) {
      return 0;
    }

    await (this.prisma as any).attendanceDay.createMany({
      data: toCreate.map((e) => ({
        companyId: e.companyId,
        employeeId: e.id,
        date: targetDate,
        status: 'ABSENT',
        totalWorkMinutes: 0,
        lateMinutes: 0,
        overtimeMinutes: 0,
        source: 'ADMIN',
        createdById,
      })),
    });

    return toCreate.length;
  }
}
