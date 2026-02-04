import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AttendanceSource,
  AttendanceStatus,
  LeaveStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { FilterLeaveTypesDto } from './dto/filter-leave-types.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { FilterLeaveRequestsDto } from './dto/filter-leave-requests.dto';
import { ReviewLeaveRequestDto, RejectLeaveRequestDto } from './dto/review-leave-request.dto';
import { buildPaginationMeta, getPagination } from '../../common/utils/pagination.util';

const KATHMANDU_OFFSET_MINUTES = 345;
const KATHMANDU_OFFSET_MS = KATHMANDU_OFFSET_MINUTES * 60000;

function toKathmanduDate(date: Date): Date {
  return new Date(date.getTime() + KATHMANDU_OFFSET_MS);
}

function getKathmanduStartOfDay(date: Date): Date {
  const ktm = toKathmanduDate(date);
  const utcMidnightKtm =
    Date.UTC(ktm.getUTCFullYear(), ktm.getUTCMonth(), ktm.getUTCDate(), 0, 0, 0, 0) -
    KATHMANDU_OFFSET_MS;
  return new Date(utcMidnightKtm);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function isSaturday(date: Date): boolean {
  return date.getUTCDay() === 6;
}

function buildLeaveDates(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let cursor = new Date(startDate.getTime());
  while (cursor <= endDate) {
    if (!isSaturday(cursor)) {
      dates.push(new Date(cursor.getTime()));
    }
    cursor = addDays(cursor, 1);
  }
  return dates;
}

@Injectable()
export class LeaveService {
  constructor(private readonly prisma: PrismaService) {}

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
        throw new ForbiddenException('You cannot create leave requests for other employees');
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

  private normalizeDateRange(startDate: Date, endDate: Date) {
    const start = getKathmanduStartOfDay(startDate);
    const end = getKathmanduStartOfDay(endDate);
    if (start.getTime() > end.getTime()) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }
    return { start, end };
  }

  private async resolveLeaveType(leaveTypeId: string, companyId: string) {
    const leaveType = await this.prisma.leaveType.findUnique({
      where: { id: leaveTypeId },
    });
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID "${leaveTypeId}" not found`);
    }
    if (leaveType.companyId !== companyId) {
      throw new ForbiddenException('You can only use leave types from your own company');
    }
    if (!leaveType.isActive) {
      throw new BadRequestException('Leave type is inactive');
    }
    return leaveType;
  }

  private async ensureNoOverlappingRequests(params: {
    employeeId: string;
    companyId: string;
    startDate: Date;
    endDate: Date;
    excludeId?: string;
  }) {
    const { employeeId, companyId, startDate, endDate, excludeId } = params;
    const overlap = await this.prisma.leaveRequest.findFirst({
      where: {
        companyId,
        employeeId,
        status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
        ...(excludeId ? { id: { not: excludeId } } : {}),
        AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
      },
    });

    if (overlap) {
      throw new ConflictException('A leave request already exists for the selected date range');
    }
  }

  private async ensureNoAttendanceConflicts(employeeId: string, dates: Date[]) {
    if (dates.length === 0) return;
    const conflicts = await this.prisma.attendanceDay.findMany({
      where: {
        employeeId,
        date: { in: dates },
        OR: [{ checkInTime: { not: null } }, { checkOutTime: { not: null } }],
      },
      select: { date: true },
    });

    if (conflicts.length > 0) {
      throw new BadRequestException(
        'Attendance already exists for one or more leave dates. Please regularize attendance first.',
      );
    }
  }

  private async applyLeaveToAttendance(params: {
    employeeId: string;
    companyId: string;
    leaveTypeName: string;
    startDate: Date;
    endDate: Date;
    reviewedById: string;
  }) {
    const { employeeId, companyId, leaveTypeName, startDate, endDate, reviewedById } = params;
    const dates = buildLeaveDates(startDate, endDate);
    if (dates.length === 0) {
      throw new BadRequestException('Leave range contains only weekend days');
    }

    await this.ensureNoAttendanceConflicts(employeeId, dates);

    await this.prisma.$transaction(
      dates.map((date) =>
        this.prisma.attendanceDay.upsert({
          where: {
            employeeId_date: {
              employeeId,
              date,
            },
          },
          update: {
            status: AttendanceStatus.ON_LEAVE,
            totalWorkMinutes: 0,
            lateMinutes: 0,
            overtimeMinutes: 0,
            source: AttendanceSource.ADMIN,
            updatedById: reviewedById,
          },
          create: {
            companyId,
            employeeId,
            date,
            status: AttendanceStatus.ON_LEAVE,
            totalWorkMinutes: 0,
            lateMinutes: 0,
            overtimeMinutes: 0,
            source: AttendanceSource.ADMIN,
            notes: `Leave: ${leaveTypeName}`,
            createdById: reviewedById,
          },
        }),
      ),
    );
  }

  async createLeaveType(dto: CreateLeaveTypeDto, companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException(`Company with ID "${companyId}" not found`);
    }
    if (company.status !== 'active') {
      throw new BadRequestException('Cannot create leave types for a suspended or archived company');
    }

    const existingName = await this.prisma.leaveType.findFirst({
      where: { companyId, name: dto.name },
    });
    if (existingName) {
      throw new ConflictException(`Leave type with name "${dto.name}" already exists in your company`);
    }

    if (dto.code) {
      const existingCode = await this.prisma.leaveType.findFirst({
        where: { companyId, code: dto.code },
      });
      if (existingCode) {
        throw new ConflictException(`Leave type with code "${dto.code}" already exists in your company`);
      }
    }

    const leaveType = await this.prisma.leaveType.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        companyId,
      },
    });

    return {
      message: 'Leave type created successfully',
      data: leaveType,
    };
  }

  async findAllLeaveTypes(filterDto: FilterLeaveTypesDto, companyId: string) {
    const {
      search,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    const where: any = { companyId };
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const validSortFields = ['createdAt', 'name', 'code', 'updatedAt'];
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const { skip, take, page: currentPage, limit: currentLimit } = getPagination(page, limit);
    const total = await this.prisma.leaveType.count({ where });

    const data = await this.prisma.leaveType.findMany({
      where,
      skip,
      take,
      orderBy: { [validSortBy]: sortOrder },
    });

    return {
      message: 'Leave types retrieved successfully',
      data,
      meta: buildPaginationMeta(total, currentPage, currentLimit),
    };
  }

  async findLeaveType(id: string, companyId: string) {
    const leaveType = await this.prisma.leaveType.findUnique({ where: { id } });
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID "${id}" not found`);
    }
    if (leaveType.companyId !== companyId) {
      throw new ForbiddenException('You can only access leave types from your own company');
    }

    return {
      message: 'Leave type retrieved successfully',
      data: leaveType,
    };
  }

  async updateLeaveType(id: string, dto: UpdateLeaveTypeDto, companyId: string) {
    const existing = await this.prisma.leaveType.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Leave type with ID "${id}" not found`);
    }
    if (existing.companyId !== companyId) {
      throw new ForbiddenException('You can only update leave types from your own company');
    }

    if (dto.name && dto.name !== existing.name) {
      const existingName = await this.prisma.leaveType.findFirst({
        where: { companyId, name: dto.name },
      });
      if (existingName) {
        throw new ConflictException(`Leave type with name "${dto.name}" already exists in your company`);
      }
    }

    if (dto.code && dto.code !== existing.code) {
      const existingCode = await this.prisma.leaveType.findFirst({
        where: { companyId, code: dto.code },
      });
      if (existingCode) {
        throw new ConflictException(`Leave type with code "${dto.code}" already exists in your company`);
      }
    }

    const updated = await this.prisma.leaveType.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        code: dto.code ?? undefined,
        description: dto.description ?? undefined,
        isActive: dto.isActive ?? undefined,
      },
    });

    return {
      message: 'Leave type updated successfully',
      data: updated,
    };
  }

  async removeLeaveType(id: string, companyId: string) {
    const existing = await this.prisma.leaveType.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Leave type with ID "${id}" not found`);
    }
    if (existing.companyId !== companyId) {
      throw new ForbiddenException('You can only delete leave types from your own company');
    }

    const requestCount = await this.prisma.leaveRequest.count({
      where: { leaveTypeId: id },
    });
    if (requestCount > 0) {
      throw new BadRequestException('Cannot delete leave type with existing leave requests');
    }

    await this.prisma.leaveType.delete({ where: { id } });

    return {
      message: 'Leave type deleted successfully',
    };
  }

  async createRequest(dto: CreateLeaveRequestDto, currentUser: any) {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }

    const employee = await this.resolveTargetEmployee(currentUser, dto.employeeId);
    const leaveType = await this.resolveLeaveType(dto.leaveTypeId, employee.companyId);
    const { start, end } = this.normalizeDateRange(dto.startDate, dto.endDate);

    await this.ensureNoOverlappingRequests({
      employeeId: employee.id,
      companyId: employee.companyId,
      startDate: start,
      endDate: end,
    });

    const dates = buildLeaveDates(start, end);
    if (dates.length === 0) {
      throw new BadRequestException('Leave range contains only weekend days');
    }

    const request = await this.prisma.leaveRequest.create({
      data: {
        companyId: employee.companyId,
        employeeId: employee.id,
        leaveTypeId: leaveType.id,
        startDate: start,
        endDate: end,
        totalDays: dates.length,
        reason: dto.reason,
        status: LeaveStatus.PENDING,
        createdById: currentUser.id,
      },
    });

    return {
      message: 'Leave request submitted',
      data: request,
    };
  }

  async findMyRequests(filter: FilterLeaveRequestsDto, currentUser: any) {
    const employee = await this.resolveTargetEmployee(currentUser);
    const { status, dateFrom, dateTo } = filter;
    const { skip, take, page, limit } = getPagination(filter.page, filter.limit);

    const where: any = { employeeId: employee.id };
    if (status) where.status = status;
    if (dateFrom) where.startDate = { ...(where.startDate || {}), gte: getKathmanduStartOfDay(dateFrom) };
    if (dateTo) where.endDate = { ...(where.endDate || {}), lte: getKathmanduStartOfDay(dateTo) };

    const total = await this.prisma.leaveRequest.count({ where });
    const data = await this.prisma.leaveRequest.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { leaveType: true },
    });

    return {
      message: 'Leave requests retrieved successfully',
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findMyRequestById(id: string, currentUser: any) {
    const employee = await this.resolveTargetEmployee(currentUser);
    const request = await this.prisma.leaveRequest.findFirst({
      where: { id, employeeId: employee.id },
      include: { leaveType: true },
    });
    if (!request) {
      throw new NotFoundException('Leave request not found');
    }

    return {
      message: 'Leave request retrieved successfully',
      data: request,
    };
  }

  async cancelMyRequest(id: string, currentUser: any) {
    const employee = await this.resolveTargetEmployee(currentUser);
    const request = await this.prisma.leaveRequest.findFirst({
      where: { id, employeeId: employee.id },
    });
    if (!request) {
      throw new NotFoundException('Leave request not found');
    }
    if (request.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: { status: LeaveStatus.CANCELLED },
    });

    return {
      message: 'Leave request cancelled',
      data: updated,
    };
  }

  async findAllRequests(filter: FilterLeaveRequestsDto, currentUser: any) {
    const role: UserRole = currentUser.role;
    const isCompanyLevel =
      role === 'company_admin' || role === 'hr_manager' || role === 'manager';
    if (!isCompanyLevel) {
      throw new ForbiddenException('Only company-level roles can view all requests');
    }

    const { status, employeeId, departmentId, leaveTypeId, dateFrom, dateTo } = filter;
    const { skip, take, page, limit } = getPagination(filter.page, filter.limit);

    const where: any = { companyId: currentUser.companyId };
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;
    if (leaveTypeId) where.leaveTypeId = leaveTypeId;
    if (dateFrom) where.startDate = { ...(where.startDate || {}), gte: getKathmanduStartOfDay(dateFrom) };
    if (dateTo) where.endDate = { ...(where.endDate || {}), lte: getKathmanduStartOfDay(dateTo) };
    if (departmentId) {
      where.employee = { departmentId };
    }

    const total = await this.prisma.leaveRequest.count({ where });
    const data = await this.prisma.leaveRequest.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { employee: true, leaveType: true },
    });

    return {
      message: 'Leave requests retrieved successfully',
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findRequestByIdForReview(id: string, currentUser: any) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true, leaveType: true },
    });
    if (!request) {
      throw new NotFoundException('Leave request not found');
    }
    this.ensureCompanyScope(currentUser, request.companyId);

    const role: UserRole = currentUser.role;
    if (!(role === 'company_admin' || role === 'hr_manager' || role === 'manager')) {
      throw new ForbiddenException('Not allowed to review leave requests');
    }

    return {
      message: 'Leave request retrieved successfully',
      data: request,
    };
  }

  async approve(id: string, body: ReviewLeaveRequestDto, currentUser: any) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { leaveType: true },
    });
    if (!request) {
      throw new NotFoundException('Leave request not found');
    }
    this.ensureCompanyScope(currentUser, request.companyId);
    if (request.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be approved');
    }

    await this.ensureNoOverlappingRequests({
      employeeId: request.employeeId,
      companyId: request.companyId,
      startDate: request.startDate,
      endDate: request.endDate,
      excludeId: request.id,
    });

    await this.applyLeaveToAttendance({
      employeeId: request.employeeId,
      companyId: request.companyId,
      leaveTypeName: request.leaveType.name,
      startDate: request.startDate,
      endDate: request.endDate,
      reviewedById: currentUser.id,
    });

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.APPROVED,
        reviewedById: currentUser.id,
        reviewedAt: new Date(),
        reviewNote: body.reviewNote,
      },
    });

    return {
      message: 'Leave request approved',
      data: updated,
    };
  }

  async reject(id: string, body: RejectLeaveRequestDto, currentUser: any) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException('Leave request not found');
    }
    this.ensureCompanyScope(currentUser, request.companyId);
    if (request.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.REJECTED,
        reviewedById: currentUser.id,
        reviewedAt: new Date(),
        reviewNote: body.reviewNote,
      },
    });

    return {
      message: 'Leave request rejected',
      data: updated,
    };
  }
}
