import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ComplaintStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginationMeta, getPagination } from '../../common/utils/pagination.util';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { FilterComplaintsDto } from './dto/filter-complaints.dto';
import { UpdateComplaintStatusDto } from './dto/update-complaint-status.dto';
import { AddComplaintNoteDto } from './dto/add-complaint-note.dto';

@Injectable()
export class ComplaintService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureCompanyScope(currentUser: any, companyId: string) {
    if (currentUser.companyId && currentUser.companyId !== companyId) {
      throw new ForbiddenException('You can only act within your own company');
    }
  }

  private ensureAdminOrHr(currentUser: any) {
    const role: UserRole = currentUser.role;
    if (!(role === 'company_admin' || role === 'hr_manager')) {
      throw new ForbiddenException('Only Company Admin or HR Manager can perform this action');
    }
  }

  private async resolveCurrentEmployee(currentUser: any) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: currentUser.id },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found for current user');
    }

    this.ensureCompanyScope(currentUser, employee.companyId);
    return employee;
  }

  private async getComplaintForCompany(complaintId: string, currentUser: any) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    this.ensureCompanyScope(currentUser, complaint.companyId);
    return complaint;
  }

  async create(dto: CreateComplaintDto, currentUser: any) {
    const employee = await this.resolveCurrentEmployee(currentUser);

    const complaint = await this.prisma.complaint.create({
      data: {
        companyId: employee.companyId,
        employeeId: employee.id,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'MEDIUM',
        createdById: currentUser.id,
      },
    });

    return {
      message: 'Complaint submitted successfully',
      data: complaint,
    };
  }

  async findMy(filter: FilterComplaintsDto, currentUser: any) {
    const employee = await this.resolveCurrentEmployee(currentUser);
    const { skip, take, page, limit } = getPagination(filter.page, filter.limit);

    const where: any = {
      employeeId: employee.id,
    };

    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority;
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {
        ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
        ...(filter.dateTo ? { lte: filter.dateTo } : {}),
      };
    }

    const total = await this.prisma.complaint.count({ where });
    const data = await this.prisma.complaint.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { notes: true },
        },
      },
    });

    return {
      message: 'Complaints retrieved successfully',
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findMyById(id: string, currentUser: any) {
    const employee = await this.resolveCurrentEmployee(currentUser);

    const complaint = await this.prisma.complaint.findFirst({
      where: {
        id,
        employeeId: employee.id,
      },
      include: {
        notes: {
          orderBy: { createdAt: 'asc' },
          include: {
            authorUser: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    return {
      message: 'Complaint retrieved successfully',
      data: complaint,
    };
  }

  async findAllAdmin(filter: FilterComplaintsDto, currentUser: any) {
    this.ensureAdminOrHr(currentUser);
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company ID not found in token');
    }

    const { skip, take, page, limit } = getPagination(filter.page, filter.limit);

    const where: any = {
      companyId: currentUser.companyId,
    };

    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority;
    if (filter.employeeId) where.employeeId = filter.employeeId;
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {
        ...(filter.dateFrom ? { gte: filter.dateFrom } : {}),
        ...(filter.dateTo ? { lte: filter.dateTo } : {}),
      };
    }

    const total = await this.prisma.complaint.count({ where });
    const data = await this.prisma.complaint.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            departmentId: true,
          },
        },
        _count: {
          select: { notes: true },
        },
      },
    });

    return {
      message: 'Complaints retrieved successfully',
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findByIdAdmin(id: string, currentUser: any) {
    this.ensureAdminOrHr(currentUser);

    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            departmentId: true,
          },
        },
        notes: {
          orderBy: { createdAt: 'asc' },
          include: {
            authorUser: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    this.ensureCompanyScope(currentUser, complaint.companyId);

    return {
      message: 'Complaint retrieved successfully',
      data: complaint,
    };
  }

  async markInProgress(id: string, dto: UpdateComplaintStatusDto, currentUser: any) {
    this.ensureAdminOrHr(currentUser);
    const complaint = await this.getComplaintForCompany(id, currentUser);

    if (complaint.status !== ComplaintStatus.OPEN) {
      throw new BadRequestException('Only open complaints can be moved to in-progress');
    }

    const updated = await this.prisma.complaint.update({
      where: { id },
      data: {
        status: ComplaintStatus.IN_PROGRESS,
        updatedById: currentUser.id,
      },
    });

    if (dto.note?.trim()) {
      await this.prisma.complaintNote.create({
        data: {
          complaintId: complaint.id,
          companyId: complaint.companyId,
          authorUserId: currentUser.id,
          note: dto.note.trim(),
        },
      });
    }

    return {
      message: 'Complaint moved to in-progress',
      data: updated,
    };
  }

  async resolve(id: string, dto: UpdateComplaintStatusDto, currentUser: any) {
    this.ensureAdminOrHr(currentUser);
    const complaint = await this.getComplaintForCompany(id, currentUser);

    if (complaint.status === ComplaintStatus.CLOSED) {
      throw new BadRequestException('Complaint is already closed');
    }

    const updated = await this.prisma.complaint.update({
      where: { id },
      data: {
        status: ComplaintStatus.CLOSED,
        closedAt: new Date(),
        updatedById: currentUser.id,
      },
    });

    const autoCloseNote = dto.note?.trim()
      ? `${dto.note.trim()}\n\nStatus updated to CLOSED.`
      : 'Complaint resolved and closed.';

    await this.prisma.complaintNote.create({
      data: {
        complaintId: complaint.id,
        companyId: complaint.companyId,
        authorUserId: currentUser.id,
        note: autoCloseNote,
      },
    });

    return {
      message: 'Complaint resolved and closed',
      data: updated,
    };
  }

  async addNote(id: string, dto: AddComplaintNoteDto, currentUser: any) {
    this.ensureAdminOrHr(currentUser);
    const complaint = await this.getComplaintForCompany(id, currentUser);

    const note = await this.prisma.complaintNote.create({
      data: {
        complaintId: complaint.id,
        companyId: complaint.companyId,
        authorUserId: currentUser.id,
        note: dto.note,
      },
      include: {
        authorUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Complaint note added successfully',
      data: note,
    };
  }
}
