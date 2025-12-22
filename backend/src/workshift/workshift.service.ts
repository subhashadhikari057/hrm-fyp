import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkShiftDto } from './dto/create-workshift.dto';
import { UpdateWorkShiftDto } from './dto/update-workshift.dto';
import { FilterWorkShiftsDto } from './dto/filter-workshifts.dto';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

function parseTimeToDate(time: string): Date {
  const match = TIME_REGEX.exec(time);
  if (!match) {
    throw new BadRequestException('Time must be in HH:mm or HH:mm:ss format (24-hour)');
  }
  const [hours, minutes, seconds] = time.split(':').map((part) => Number(part));
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds ?? 0));
}

function timeToSeconds(value: Date): number {
  return value.getUTCHours() * 3600 + value.getUTCMinutes() * 60 + value.getUTCSeconds();
}

@Injectable()
export class WorkShiftService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new work shift (Company Admin / HR Manager only)
   * Auto-assigns companyId from authenticated user
   */
  async create(createWorkShiftDto: CreateWorkShiftDto, companyId: string) {
    // Validate company exists and is active
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${companyId}" not found`);
    }

    if (company.status !== 'active') {
      throw new BadRequestException('Cannot create work shifts for a suspended or archived company');
    }

    // Check if work shift name already exists in this company
    const existingName = await this.prisma.workShift.findFirst({
      where: {
        companyId,
        name: createWorkShiftDto.name,
      },
    });

    if (existingName) {
      throw new ConflictException(`Work shift with name "${createWorkShiftDto.name}" already exists in your company`);
    }

    // Check if work shift code already exists in this company (if code provided)
    if (createWorkShiftDto.code) {
      const existingCode = await this.prisma.workShift.findFirst({
        where: {
          companyId,
          code: createWorkShiftDto.code,
        },
      });

      if (existingCode) {
        throw new ConflictException(`Work shift with code "${createWorkShiftDto.code}" already exists in your company`);
      }
    }

    const startTime = parseTimeToDate(createWorkShiftDto.startTime);
    const endTime = parseTimeToDate(createWorkShiftDto.endTime);

    if (timeToSeconds(startTime) === timeToSeconds(endTime)) {
      throw new BadRequestException('Start time and end time must be different');
    }

    // Create work shift
    const workShift = await this.prisma.workShift.create({
      data: {
        name: createWorkShiftDto.name,
        code: createWorkShiftDto.code,
        description: createWorkShiftDto.description,
        startTime,
        endTime,
        isActive: createWorkShiftDto.isActive !== undefined ? createWorkShiftDto.isActive : true,
        companyId: companyId, // Auto-assigned from authenticated user
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        startTime: true,
        endTime: true,
        isActive: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Work shift created successfully',
      data: workShift,
    };
  }

  /**
   * Get all work shifts from company with filters and pagination
   */
  async findAll(filterDto: FilterWorkShiftsDto, companyId: string) {
    const {
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    // Build where clause (always filter by companyId)
    const where: any = {
      companyId: companyId, // Auto-filter by company
    };
    if (isActive !== undefined) where.isActive = isActive;

    // Validate sortBy field
    const validSortFields = ['createdAt', 'name', 'code', 'startTime', 'endTime', 'updatedAt'];
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await this.prisma.workShift.count({ where });

    // Get work shifts with pagination
    const workShifts = await this.prisma.workShift.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [validSortBy]: sortOrder,
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        startTime: true,
        endTime: true,
        isActive: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Work shifts retrieved successfully',
      data: workShifts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get work shift by ID (Company Admin / HR Manager only)
   */
  async findOne(id: string, companyId: string) {
    const workShift = await this.prisma.workShift.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        startTime: true,
        endTime: true,
        isActive: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!workShift) {
      throw new NotFoundException(`Work shift with ID "${id}" not found`);
    }

    // Verify work shift belongs to company
    if (workShift.companyId !== companyId) {
      throw new ForbiddenException('You can only access work shifts from your own company');
    }

    return {
      message: 'Work shift retrieved successfully',
      data: workShift,
    };
  }

  /**
   * Update work shift (Company Admin / HR Manager only)
   */
  async update(id: string, updateWorkShiftDto: UpdateWorkShiftDto, companyId: string) {
    // Check if work shift exists and belongs to company
    const existingWorkShift = await this.prisma.workShift.findUnique({
      where: { id },
    });

    if (!existingWorkShift) {
      throw new NotFoundException(`Work shift with ID "${id}" not found`);
    }

    if (existingWorkShift.companyId !== companyId) {
      throw new ForbiddenException('You can only update work shifts from your own company');
    }

    // Check if new name already exists in this company (if name is being updated)
    if (updateWorkShiftDto.name && updateWorkShiftDto.name !== existingWorkShift.name) {
      const existingName = await this.prisma.workShift.findFirst({
        where: {
          companyId,
          name: updateWorkShiftDto.name,
        },
      });

      if (existingName) {
        throw new ConflictException(`Work shift with name "${updateWorkShiftDto.name}" already exists in your company`);
      }
    }

    // Check if new code already exists in this company (if code is being updated)
    if (updateWorkShiftDto.code && updateWorkShiftDto.code !== existingWorkShift.code) {
      const existingCode = await this.prisma.workShift.findFirst({
        where: {
          companyId,
          code: updateWorkShiftDto.code,
        },
      });

      if (existingCode) {
        throw new ConflictException(`Work shift with code "${updateWorkShiftDto.code}" already exists in your company`);
      }
    }

    const nextStartTime = updateWorkShiftDto.startTime
      ? parseTimeToDate(updateWorkShiftDto.startTime)
      : existingWorkShift.startTime;
    const nextEndTime = updateWorkShiftDto.endTime
      ? parseTimeToDate(updateWorkShiftDto.endTime)
      : existingWorkShift.endTime;

    if (timeToSeconds(nextStartTime) === timeToSeconds(nextEndTime)) {
      throw new BadRequestException('Start time and end time must be different');
    }

    // Build update data
    const updateData: any = {};
    if (updateWorkShiftDto.name !== undefined) updateData.name = updateWorkShiftDto.name;
    if (updateWorkShiftDto.code !== undefined) updateData.code = updateWorkShiftDto.code;
    if (updateWorkShiftDto.description !== undefined) updateData.description = updateWorkShiftDto.description;
    if (updateWorkShiftDto.startTime !== undefined) updateData.startTime = nextStartTime;
    if (updateWorkShiftDto.endTime !== undefined) updateData.endTime = nextEndTime;
    if (updateWorkShiftDto.isActive !== undefined) updateData.isActive = updateWorkShiftDto.isActive;

    // Update work shift
    const updatedWorkShift = await this.prisma.workShift.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        startTime: true,
        endTime: true,
        isActive: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Work shift updated successfully',
      data: updatedWorkShift,
    };
  }

  /**
   * Delete work shift (Company Admin / HR Manager only)
   */
  async remove(id: string, companyId: string) {
    // Check if work shift exists and belongs to company
    const workShift = await this.prisma.workShift.findUnique({
      where: { id },
    });

    if (!workShift) {
      throw new NotFoundException(`Work shift with ID "${id}" not found`);
    }

    if (workShift.companyId !== companyId) {
      throw new ForbiddenException('You can only delete work shifts from your own company');
    }

    // Check if any employee references this work shift
    const employeeCount = await this.prisma.employee.count({
      where: { workShiftId: id },
    });

    if (employeeCount > 0) {
      throw new BadRequestException(
        `Cannot delete work shift. ${employeeCount} employee(s) are assigned to this work shift. Please reassign employees before deleting.`,
      );
    }

    // Delete work shift
    await this.prisma.workShift.delete({
      where: { id },
    });

    return {
      message: 'Work shift deleted successfully',
    };
  }
}
