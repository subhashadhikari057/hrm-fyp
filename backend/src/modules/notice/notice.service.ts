import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NoticeAudienceType,
  NoticePriority,
  NoticeStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginationMeta, getPagination } from '../../common/utils/pagination.util';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { FilterNoticesDto } from './dto/filter-notices.dto';
import { FilterMyNoticesDto } from './dto/filter-my-notices.dto';
import { NoticeAudienceDto } from './dto/notice-audience.dto';

@Injectable()
export class NoticeService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureCompanyScope(currentUser: any, companyId: string) {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    if (currentUser.companyId !== companyId) {
      throw new ForbiddenException('You can only act within your own company');
    }
  }

  private validatePublishWindow(publishAt?: Date, expiresAt?: Date) {
    if (publishAt && expiresAt && expiresAt.getTime() <= publishAt.getTime()) {
      throw new BadRequestException('expiresAt must be after publishAt');
    }
  }

  private getDefaultExpiry(publishAt?: Date, status?: NoticeStatus) {
    const base = publishAt ?? (status === NoticeStatus.PUBLISHED ? new Date() : undefined);
    if (!base) {
      return undefined;
    }
    const next = new Date(base);
    next.setMonth(next.getMonth() + 1);
    return next;
  }

  private async validateAudiences(companyId: string, audiences: NoticeAudienceDto[]) {
    if (!audiences || audiences.length === 0) {
      return;
    }

    const departmentIds = new Set<string>();
    const designationIds = new Set<string>();
    const employeeIds = new Set<string>();
    const workShiftIds = new Set<string>();

    audiences.forEach((audience, index) => {
      switch (audience.type) {
        case NoticeAudienceType.DEPARTMENT:
          if (!audience.departmentId) {
            throw new BadRequestException(`audiences[${index}].departmentId is required`);
          }
          departmentIds.add(audience.departmentId);
          break;
        case NoticeAudienceType.DESIGNATION:
          if (!audience.designationId) {
            throw new BadRequestException(`audiences[${index}].designationId is required`);
          }
          designationIds.add(audience.designationId);
          break;
        case NoticeAudienceType.EMPLOYEE:
          if (!audience.employeeId) {
            throw new BadRequestException(`audiences[${index}].employeeId is required`);
          }
          employeeIds.add(audience.employeeId);
          break;
        case NoticeAudienceType.ROLE:
          if (!audience.role) {
            throw new BadRequestException(`audiences[${index}].role is required`);
          }
          break;
        case NoticeAudienceType.WORK_SHIFT:
          if (!audience.workShiftId) {
            throw new BadRequestException(`audiences[${index}].workShiftId is required`);
          }
          workShiftIds.add(audience.workShiftId);
          break;
        default:
          throw new BadRequestException(`audiences[${index}].type is invalid`);
      }
    });

    if (departmentIds.size > 0) {
      const count = await this.prisma.department.count({
        where: { id: { in: Array.from(departmentIds) }, companyId },
      });
      if (count !== departmentIds.size) {
        throw new BadRequestException('One or more departments are invalid');
      }
    }

    if (designationIds.size > 0) {
      const count = await this.prisma.designation.count({
        where: { id: { in: Array.from(designationIds) }, companyId },
      });
      if (count !== designationIds.size) {
        throw new BadRequestException('One or more designations are invalid');
      }
    }

    if (employeeIds.size > 0) {
      const count = await this.prisma.employee.count({
        where: { id: { in: Array.from(employeeIds) }, companyId },
      });
      if (count !== employeeIds.size) {
        throw new BadRequestException('One or more employees are invalid');
      }
    }

    if (workShiftIds.size > 0) {
      const count = await this.prisma.workShift.count({
        where: { id: { in: Array.from(workShiftIds) }, companyId },
      });
      if (count !== workShiftIds.size) {
        throw new BadRequestException('One or more work shifts are invalid');
      }
    }
  }

  private buildAudienceMatches(employee: any, role: UserRole) {
    const audienceTargets: any[] = [];

    if (employee.departmentId) {
      audienceTargets.push({
        type: NoticeAudienceType.DEPARTMENT,
        departmentId: employee.departmentId,
      });
    }

    if (employee.designationId) {
      audienceTargets.push({
        type: NoticeAudienceType.DESIGNATION,
        designationId: employee.designationId,
      });
    }

    if (employee.workShiftId) {
      audienceTargets.push({
        type: NoticeAudienceType.WORK_SHIFT,
        workShiftId: employee.workShiftId,
      });
    }

    audienceTargets.push({
      type: NoticeAudienceType.EMPLOYEE,
      employeeId: employee.id,
    });

    audienceTargets.push({
      type: NoticeAudienceType.ROLE,
      role,
    });

    return audienceTargets;
  }

  private buildVisibilityWhere(employee: any, role: UserRole, filter?: FilterMyNoticesDto) {
    const now = new Date();
    const audienceTargets = this.buildAudienceMatches(employee, role);

    const andConditions: any[] = [
      {
        OR: [{ publishAt: null }, { publishAt: { lte: now } }],
      },
      {
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      {
        OR: [
          { isCompanyWide: true },
          audienceTargets.length > 0
            ? {
                audiences: {
                  some: {
                    OR: audienceTargets,
                  },
                },
              }
            : undefined,
        ].filter(Boolean),
      },
    ];

    if (filter?.search) {
      andConditions.push({
        OR: [
          { title: { contains: filter.search, mode: 'insensitive' } },
          { body: { contains: filter.search, mode: 'insensitive' } },
        ],
      });
    }

    if (filter?.unreadOnly) {
      andConditions.push({
        reads: { none: { employeeId: employee.id } },
      });
    }

    return {
      companyId: employee.companyId,
      status: NoticeStatus.PUBLISHED,
      AND: andConditions,
    };
  }

  async create(dto: CreateNoticeDto, currentUser: any) {
    const companyId = currentUser.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }

    const status = dto.status ?? NoticeStatus.DRAFT;
    const publishAt = dto.publishAt;
    const expiresAt = dto.expiresAt ?? this.getDefaultExpiry(publishAt, status);

    this.validatePublishWindow(publishAt, expiresAt);

    const hasAudiences = Array.isArray(dto.audiences) && dto.audiences.length > 0;
    const isCompanyWide = hasAudiences ? false : dto.isCompanyWide ?? true;

    if (!isCompanyWide && !hasAudiences) {
      throw new BadRequestException('audiences are required when isCompanyWide is false');
    }

    if (hasAudiences) {
      await this.validateAudiences(companyId, dto.audiences ?? []);
    }

    const notice = await this.prisma.notice.create({
      data: {
        companyId,
        title: dto.title,
        body: dto.body,
        bannerUrl: null,
        priority: dto.priority ?? NoticePriority.NORMAL,
        status,
        publishAt,
        expiresAt,
        isCompanyWide,
        createdById: currentUser.id,
        updatedById: currentUser.id,
        audiences: hasAudiences
          ? {
              create: (dto.audiences ?? []).map((audience) => ({
                type: audience.type,
                departmentId: audience.departmentId,
                designationId: audience.designationId,
                employeeId: audience.employeeId,
                role: audience.role,
                workShiftId: audience.workShiftId,
              })),
            }
          : undefined,
      },
      include: {
        audiences: true,
      },
    });

    return {
      message: 'Notice created successfully',
      data: notice,
    };
  }

  async update(id: string, dto: UpdateNoticeDto, currentUser: any) {
    const existing = await this.prisma.notice.findUnique({
      where: { id },
      include: { audiences: true },
    });

    if (!existing) {
      throw new NotFoundException('Notice not found');
    }

    this.ensureCompanyScope(currentUser, existing.companyId);
    const nextStatus = dto.status ?? existing.status;
    const nextPublishAt = dto.publishAt ?? existing.publishAt ?? undefined;
    const defaultExpiresAt =
      dto.expiresAt === undefined && !existing.expiresAt
        ? this.getDefaultExpiry(nextPublishAt, nextStatus)
        : undefined;
    const finalExpiresAt = dto.expiresAt ?? existing.expiresAt ?? defaultExpiresAt ?? undefined;

    this.validatePublishWindow(nextPublishAt, finalExpiresAt);

    const audiencesProvided = Array.isArray(dto.audiences);
    const hasAudiences = (dto.audiences?.length ?? 0) > 0;

    let nextIsCompanyWide = dto.isCompanyWide ?? existing.isCompanyWide;
    if (hasAudiences) {
      nextIsCompanyWide = false;
    }

    if (!nextIsCompanyWide) {
      if (audiencesProvided && !hasAudiences) {
        throw new BadRequestException('audiences are required when isCompanyWide is false');
      }
      if (!audiencesProvided && existing.audiences.length === 0) {
        throw new BadRequestException('audiences are required when isCompanyWide is false');
      }
    }

    if (hasAudiences) {
      await this.validateAudiences(existing.companyId, dto.audiences ?? []);
    }

    const updateData: any = {
      updatedById: currentUser.id,
    };

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.body !== undefined) updateData.body = dto.body;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.publishAt !== undefined) updateData.publishAt = dto.publishAt;
    if (dto.expiresAt !== undefined) {
      updateData.expiresAt = dto.expiresAt;
    } else if (defaultExpiresAt) {
      updateData.expiresAt = defaultExpiresAt;
    }
    if (dto.isCompanyWide !== undefined || hasAudiences) updateData.isCompanyWide = nextIsCompanyWide;
    updateData.bannerUrl = null;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (audiencesProvided) {
        await tx.noticeAudience.deleteMany({ where: { noticeId: existing.id } });
        if (hasAudiences) {
          await tx.noticeAudience.createMany({
            data: (dto.audiences ?? []).map((audience) => ({
              noticeId: existing.id,
              type: audience.type,
              departmentId: audience.departmentId,
              designationId: audience.designationId,
              employeeId: audience.employeeId,
              role: audience.role,
              workShiftId: audience.workShiftId,
            })),
          });
        }
      }

      return tx.notice.update({
        where: { id: existing.id },
        data: updateData,
        include: { audiences: true },
      });
    });

    return {
      message: 'Notice updated successfully',
      data: updated,
    };
  }

  async remove(id: string, currentUser: any) {
    const notice = await this.prisma.notice.findUnique({
      where: { id },
    });
    if (!notice) {
      throw new NotFoundException('Notice not found');
    }
    this.ensureCompanyScope(currentUser, notice.companyId);

    await this.prisma.notice.delete({ where: { id } });

    return {
      message: 'Notice deleted successfully',
    };
  }

  async listAdmin(filter: FilterNoticesDto, currentUser: any) {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }

    const { skip, take, page, limit } = getPagination(filter.page, filter.limit);

    const where: any = {
      companyId: currentUser.companyId,
    };

    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority;
    if (filter.isCompanyWide !== undefined) where.isCompanyWide = filter.isCompanyWide;
    if (filter.createdById) where.createdById = filter.createdById;
    if (filter.publishFrom) where.publishAt = { ...(where.publishAt || {}), gte: filter.publishFrom };
    if (filter.publishTo) where.publishAt = { ...(where.publishAt || {}), lte: filter.publishTo };

    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { body: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.notice.count({ where });
    const data = await this.prisma.notice.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        audiences: true,
        _count: {
          select: { reads: true },
        },
      },
    });

    return {
      message: 'Notices retrieved successfully',
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getAdminById(id: string, currentUser: any) {
    const notice = await this.prisma.notice.findUnique({
      where: { id },
      include: {
        audiences: true,
        reads: true,
        _count: {
          select: { reads: true },
        },
      },
    });

    if (!notice) {
      throw new NotFoundException('Notice not found');
    }

    this.ensureCompanyScope(currentUser, notice.companyId);

    return {
      message: 'Notice retrieved successfully',
      data: notice,
    };
  }

  async listMy(filter: FilterMyNoticesDto, currentUser: any) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: currentUser.id },
      select: {
        id: true,
        companyId: true,
        departmentId: true,
        designationId: true,
        workShiftId: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found for current user');
    }

    this.ensureCompanyScope(currentUser, employee.companyId);

    const { skip, take, page, limit } = getPagination(filter.page, filter.limit);
    const where = this.buildVisibilityWhere(employee, currentUser.role, filter);

    const total = await this.prisma.notice.count({ where });
    const data = await this.prisma.notice.findMany({
      where,
      skip,
      take,
      orderBy: [{ publishAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        reads: {
          where: { employeeId: employee.id },
          select: { readAt: true },
        },
      },
    });

    const formatted = data.map(({ reads, ...notice }) => ({
      ...notice,
      isRead: reads.length > 0,
      readAt: reads[0]?.readAt ?? null,
    }));

    return {
      message: 'Notices retrieved successfully',
      data: formatted,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getMyById(id: string, currentUser: any) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: currentUser.id },
      select: {
        id: true,
        companyId: true,
        departmentId: true,
        designationId: true,
        workShiftId: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found for current user');
    }

    this.ensureCompanyScope(currentUser, employee.companyId);

    const where = this.buildVisibilityWhere(employee, currentUser.role, undefined);

    const notice = await this.prisma.notice.findFirst({
      where: { id, ...where },
      include: {
        reads: {
          where: { employeeId: employee.id },
          select: { readAt: true },
        },
      },
    });

    if (!notice) {
      throw new NotFoundException('Notice not found');
    }

    const { reads, ...rest } = notice;
    const formatted = {
      ...rest,
      isRead: reads.length > 0,
      readAt: reads[0]?.readAt ?? null,
    };

    return {
      message: 'Notice retrieved successfully',
      data: formatted,
    };
  }

  async markRead(id: string, currentUser: any) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: currentUser.id },
      select: {
        id: true,
        companyId: true,
        departmentId: true,
        designationId: true,
        workShiftId: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found for current user');
    }

    this.ensureCompanyScope(currentUser, employee.companyId);

    const where = this.buildVisibilityWhere(employee, currentUser.role, undefined);
    const notice = await this.prisma.notice.findFirst({
      where: { id, ...where },
      select: { id: true },
    });

    if (!notice) {
      throw new NotFoundException('Notice not found');
    }

    const read = await this.prisma.noticeRead.upsert({
      where: {
        noticeId_employeeId: {
          noticeId: id,
          employeeId: employee.id,
        },
      },
      update: {},
      create: {
        noticeId: id,
        employeeId: employee.id,
      },
    });

    return {
      message: 'Notice marked as read',
      data: read,
    };
  }
}
