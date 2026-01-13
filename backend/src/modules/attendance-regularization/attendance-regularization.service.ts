import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  RegularizationRequestType,
  RegularizationStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRegularizationDto } from './dto/create-regularization.dto';
import { FilterRegularizationsDto } from './dto/filter-regularizations.dto';
import { ReviewRegularizationDto, RejectRegularizationDto } from './dto/review-regularization.dto';
import { AttendanceService } from '../attendance/attendance.service';
import { buildPaginationMeta, getPagination } from '../../common/utils/pagination.util';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const MAX_PAST_DAYS = 30;

function parseTimeToDate(time: string): Date {
  if (!TIME_REGEX.test(time)) {
    throw new BadRequestException('Time must be in HH:mm or HH:mm:ss format (24-hour)');
  }
  const [hours, minutes, seconds] = time.split(':').map((part) => Number(part));
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds ?? 0));
}

function getStartOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

@Injectable()
export class AttendanceRegularizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attendanceService: AttendanceService,
  ) {}

  private ensureCompanyScope(currentUser: any, companyId: string) {
    if (currentUser.companyId && currentUser.companyId !== companyId) {
      throw new ForbiddenException('You can only act within your own company');
    }
  }

  private async resolveTargetEmployee(currentUser: any, explicitEmployeeId?: string) {
    const role: UserRole = currentUser.role;
    const isCompanyLevel =
      role === 'company_admin' || role === 'hr_manager' || role === 'manager';

    if (explicitEmployeeId) {
      if (!isCompanyLevel) {
        throw new ForbiddenException('You cannot create regularizations for other employees');
      }
      const employee = await this.prisma.employee.findUnique({
        where: { id: explicitEmployeeId },
        include: { user: true },
      });
      if (!employee) {
        throw new NotFoundException(`Employee with ID "${explicitEmployeeId}" not found`);
      }
      this.ensureCompanyScope(currentUser, employee.companyId);
      return employee;
    }

    // self
    const employee = await this.prisma.employee.findFirst({
      where: { userId: currentUser.id },
      include: { user: true },
    });
    if (!employee) {
      throw new NotFoundException('Employee profile not found for current user');
    }
    this.ensureCompanyScope(currentUser, employee.companyId);
    return employee;
  }

  private validateCreate(dto: CreateRegularizationDto) {
    dto.validateTimes?.();

    const today = getStartOfDay(new Date());
    const target = getStartOfDay(dto.date);

    if (target.getTime() > today.getTime()) {
      throw new BadRequestException('Cannot request regularization for a future date');
    }

    const diffDays = Math.floor((today.getTime() - target.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays > MAX_PAST_DAYS) {
      throw new BadRequestException(`Regularization allowed only within past ${MAX_PAST_DAYS} days`);
    }

    if (
      (dto.requestType === RegularizationRequestType.MISSED_CHECKIN ||
        dto.requestType === RegularizationRequestType.WRONG_TIME ||
        dto.requestType === RegularizationRequestType.FULL_DAY_EDIT) &&
      !dto.requestedCheckInTime
    ) {
      throw new BadRequestException('requestedCheckInTime is required for this request type');
    }

    if (
      (dto.requestType === RegularizationRequestType.MISSED_CHECKOUT ||
        dto.requestType === RegularizationRequestType.WRONG_TIME ||
        dto.requestType === RegularizationRequestType.FULL_DAY_EDIT) &&
      !dto.requestedCheckOutTime
    ) {
      throw new BadRequestException('requestedCheckOutTime is required for this request type');
    }

    if (dto.requestedCheckInTime && dto.requestedCheckOutTime) {
      const inTime = parseTimeToDate(dto.requestedCheckInTime);
      const outTime = parseTimeToDate(dto.requestedCheckOutTime);
      if (outTime.getTime() <= inTime.getTime()) {
        throw new BadRequestException('Check-out must be after check-in');
      }
    }
  }

  async create(dto: CreateRegularizationDto, currentUser: any) {
    this.validateCreate(dto);

    const employee = await this.resolveTargetEmployee(currentUser, dto.employeeId);
    const targetDate = getStartOfDay(dto.date);

    const existingPending = await (this.prisma as any).attendanceRegularization.findFirst({
      where: {
        employeeId: employee.id,
        date: targetDate,
        status: RegularizationStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new ConflictException('A pending regularization already exists for this date');
    }

    const attendanceDay = await (this.prisma as any).attendanceDay.findFirst({
      where: {
        employeeId: employee.id,
        date: targetDate,
      },
      select: {
        id: true,
        checkInTime: true,
        checkOutTime: true,
        status: true,
        totalWorkMinutes: true,
        lateMinutes: true,
        overtimeMinutes: true,
      },
    });

    const requestedCheckIn = dto.requestedCheckInTime ? parseTimeToDate(dto.requestedCheckInTime) : null;
    const requestedCheckOut = dto.requestedCheckOutTime ? parseTimeToDate(dto.requestedCheckOutTime) : null;

    const reg = await (this.prisma as any).attendanceRegularization.create({
      data: {
        companyId: employee.companyId,
        employeeId: employee.id,
        attendanceDayId: attendanceDay?.id ?? null,
        date: targetDate,
        requestType: dto.requestType,
        requestedCheckInTime: requestedCheckIn,
        requestedCheckOutTime: requestedCheckOut,
        reason: dto.reason,
        status: RegularizationStatus.PENDING,
        beforeSnapshot: attendanceDay
          ? {
              checkInTime: attendanceDay.checkInTime,
              checkOutTime: attendanceDay.checkOutTime,
              status: attendanceDay.status,
              totalWorkMinutes: attendanceDay.totalWorkMinutes,
              lateMinutes: attendanceDay.lateMinutes,
              overtimeMinutes: attendanceDay.overtimeMinutes,
            }
          : null,
      },
    });

    return {
      message: 'Regularization request submitted',
      data: reg,
    };
  }

  async findMyRequests(filter: FilterRegularizationsDto, currentUser: any) {
    const employee = await this.resolveTargetEmployee(currentUser);
    const { status, dateFrom, dateTo } = filter;
    const { skip, take, page, limit } = getPagination(filter.page, filter.limit);

    const where: any = {
      employeeId: employee.id,
    };
    if (status) where.status = status;
    if (dateFrom) where.date = { ...(where.date || {}), gte: getStartOfDay(dateFrom) };
    if (dateTo) where.date = { ...(where.date || {}), lte: getStartOfDay(dateTo) };

    const total = await (this.prisma as any).attendanceRegularization.count({ where });
    const data = await (this.prisma as any).attendanceRegularization.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Regularizations retrieved successfully',
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findMyRequestById(id: string, currentUser: any) {
    const employee = await this.resolveTargetEmployee(currentUser);
    const reg = await (this.prisma as any).attendanceRegularization.findFirst({
      where: { id, employeeId: employee.id },
    });
    if (!reg) {
      throw new NotFoundException('Regularization not found');
    }
    return {
      message: 'Regularization retrieved successfully',
      data: reg,
    };
  }

  async cancelMyRequest(id: string, currentUser: any) {
    const employee = await this.resolveTargetEmployee(currentUser);
    const reg = await (this.prisma as any).attendanceRegularization.findFirst({
      where: { id, employeeId: employee.id },
    });
    if (!reg) {
      throw new NotFoundException('Regularization not found');
    }
    if (reg.status !== RegularizationStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }
    const updated = await (this.prisma as any).attendanceRegularization.update({
      where: { id },
      data: {
        status: RegularizationStatus.CANCELLED,
      },
    });
    return {
      message: 'Regularization cancelled',
      data: updated,
    };
  }

  async findAll(filter: FilterRegularizationsDto, currentUser: any) {
    const role: UserRole = currentUser.role;
    const isCompanyLevel =
      role === 'company_admin' || role === 'hr_manager' || role === 'manager';
    if (!isCompanyLevel) {
      throw new ForbiddenException('Only company-level roles can view all requests');
    }

    const { status, employeeId, departmentId, dateFrom, dateTo } = filter;
    const { skip, take, page, limit } = getPagination(filter.page, filter.limit);

    const where: any = {
      companyId: currentUser.companyId,
    };
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;
    if (dateFrom) where.date = { ...(where.date || {}), gte: getStartOfDay(dateFrom) };
    if (dateTo) where.date = { ...(where.date || {}), lte: getStartOfDay(dateTo) };
    if (departmentId) {
      where.employee = { departmentId };
    }

    const total = await (this.prisma as any).attendanceRegularization.count({ where });
    const data = await (this.prisma as any).attendanceRegularization.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: true,
      },
    });

    return {
      message: 'Regularizations retrieved successfully',
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findByIdForReview(id: string, currentUser: any) {
    const reg = await (this.prisma as any).attendanceRegularization.findFirst({
      where: { id },
      include: {
        employee: true,
      },
    });
    if (!reg) {
      throw new NotFoundException('Regularization not found');
    }
    this.ensureCompanyScope(currentUser, reg.companyId);
    const role: UserRole = currentUser.role;
    if (!(role === 'company_admin' || role === 'hr_manager' || role === 'manager')) {
      throw new ForbiddenException('Not allowed to review regularizations');
    }
    return {
      message: 'Regularization retrieved successfully',
      data: reg,
    };
  }

  async approve(id: string, body: ReviewRegularizationDto, currentUser: any) {
    const reg = await (this.prisma as any).attendanceRegularization.findFirst({
      where: { id },
      include: { employee: true },
    });
    if (!reg) {
      throw new NotFoundException('Regularization not found');
    }
    this.ensureCompanyScope(currentUser, reg.companyId);
    if (reg.status !== RegularizationStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be approved');
    }

    const applied = await this.attendanceService.applyRegularization({
      employeeId: reg.employeeId,
      date: reg.date,
      requestedCheckInTime: reg.requestedCheckInTime ?? undefined,
      requestedCheckOutTime: reg.requestedCheckOutTime ?? undefined,
      createdById: currentUser.id,
    });

    const updated = await (this.prisma as any).attendanceRegularization.update({
      where: { id },
      data: {
        status: RegularizationStatus.APPROVED,
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
        reviewNote: body.reviewNote,
        attendanceDayId: applied.attendanceDayId,
        beforeSnapshot: applied.beforeSnapshot,
        afterSnapshot: applied.afterSnapshot,
      },
    });

    return {
      message: 'Regularization approved',
      data: updated,
    };
  }

  async reject(id: string, body: RejectRegularizationDto, currentUser: any) {
    const reg = await (this.prisma as any).attendanceRegularization.findFirst({
      where: { id },
      include: { employee: true },
    });
    if (!reg) {
      throw new NotFoundException('Regularization not found');
    }
    this.ensureCompanyScope(currentUser, reg.companyId);
    if (reg.status !== RegularizationStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    const updated = await (this.prisma as any).attendanceRegularization.update({
      where: { id },
      data: {
        status: RegularizationStatus.REJECTED,
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
        reviewNote: body.reviewNote,
      },
    });

    return {
      message: 'Regularization rejected',
      data: updated,
    };
  }
}
