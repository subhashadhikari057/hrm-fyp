import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { FilterDesignationsDto } from './dto/filter-designations.dto';

@Injectable()
export class DesignationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new designation (Company Admin / HR Manager only)
   * Auto-assigns companyId from authenticated user
   */
  async create(createDesignationDto: CreateDesignationDto, companyId: string) {
    // Validate company exists and is active
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${companyId}" not found`);
    }

    if (company.status !== 'active') {
      throw new BadRequestException('Cannot create designations for a suspended or archived company');
    }

    // Check if designation name already exists in this company
    const existingName = await this.prisma.designation.findFirst({
      where: {
        companyId,
        name: createDesignationDto.name,
      },
    });

    if (existingName) {
      throw new ConflictException(`Designation with name "${createDesignationDto.name}" already exists in your company`);
    }

    // Check if designation code already exists in this company (if code provided)
    if (createDesignationDto.code) {
      const existingCode = await this.prisma.designation.findFirst({
        where: {
          companyId,
          code: createDesignationDto.code,
        },
      });

      if (existingCode) {
        throw new ConflictException(`Designation with code "${createDesignationDto.code}" already exists in your company`);
      }
    }

    // Create designation
    const designation = await this.prisma.designation.create({
      data: {
        name: createDesignationDto.name,
        code: createDesignationDto.code,
        description: createDesignationDto.description,
        isActive: createDesignationDto.isActive !== undefined ? createDesignationDto.isActive : true,
        companyId: companyId, // Auto-assigned from authenticated user
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        isActive: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Designation created successfully',
      data: designation,
    };
  }

  /**
   * Get all designations from company with filters and pagination
   */
  async findAll(filterDto: FilterDesignationsDto, companyId: string) {
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
    const validSortFields = ['createdAt', 'name', 'code', 'updatedAt'];
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await this.prisma.designation.count({ where });

    // Get designations with pagination
    const designations = await this.prisma.designation.findMany({
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
        isActive: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Designations retrieved successfully',
      data: designations,
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
   * Get designation by ID (Company Admin / HR Manager only)
   */
  async findOne(id: string, companyId: string) {
    const designation = await this.prisma.designation.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        isActive: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!designation) {
      throw new NotFoundException(`Designation with ID "${id}" not found`);
    }

    // Verify designation belongs to company
    if (designation.companyId !== companyId) {
      throw new ForbiddenException('You can only access designations from your own company');
    }

    return {
      message: 'Designation retrieved successfully',
      data: designation,
    };
  }

  /**
   * Update designation (Company Admin / HR Manager only)
   */
  async update(id: string, updateDesignationDto: UpdateDesignationDto, companyId: string) {
    // Check if designation exists and belongs to company
    const existingDesignation = await this.prisma.designation.findUnique({
      where: { id },
    });

    if (!existingDesignation) {
      throw new NotFoundException(`Designation with ID "${id}" not found`);
    }

    if (existingDesignation.companyId !== companyId) {
      throw new ForbiddenException('You can only update designations from your own company');
    }

    // Check if new name already exists in this company (if name is being updated)
    if (updateDesignationDto.name && updateDesignationDto.name !== existingDesignation.name) {
      const existingName = await this.prisma.designation.findFirst({
        where: {
          companyId,
          name: updateDesignationDto.name,
        },
      });

      if (existingName) {
        throw new ConflictException(`Designation with name "${updateDesignationDto.name}" already exists in your company`);
      }
    }

    // Check if new code already exists in this company (if code is being updated)
    if (updateDesignationDto.code && updateDesignationDto.code !== existingDesignation.code) {
      const existingCode = await this.prisma.designation.findFirst({
        where: {
          companyId,
          code: updateDesignationDto.code,
        },
      });

      if (existingCode) {
        throw new ConflictException(`Designation with code "${updateDesignationDto.code}" already exists in your company`);
      }
    }

    // Build update data
    const updateData: any = {};
    if (updateDesignationDto.name !== undefined) updateData.name = updateDesignationDto.name;
    if (updateDesignationDto.code !== undefined) updateData.code = updateDesignationDto.code;
    if (updateDesignationDto.description !== undefined) updateData.description = updateDesignationDto.description;
    if (updateDesignationDto.isActive !== undefined) updateData.isActive = updateDesignationDto.isActive;

    // Update designation
    const updatedDesignation = await this.prisma.designation.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        isActive: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Designation updated successfully',
      data: updatedDesignation,
    };
  }

  /**
   * Delete designation (Company Admin / HR Manager only)
   */
  async remove(id: string, companyId: string) {
    // Check if designation exists and belongs to company
    const designation = await this.prisma.designation.findUnique({
      where: { id },
    });

    if (!designation) {
      throw new NotFoundException(`Designation with ID "${id}" not found`);
    }

    if (designation.companyId !== companyId) {
      throw new ForbiddenException('You can only delete designations from your own company');
    }

    // Check if any employee references this designation
    const employeeCount = await this.prisma.employee.count({
      where: { designationId: id },
    });

    if (employeeCount > 0) {
      throw new BadRequestException(
        `Cannot delete designation. ${employeeCount} employee(s) are assigned to this designation. Please reassign employees before deleting.`,
      );
    }

    // Delete designation
    await this.prisma.designation.delete({
      where: { id },
    });

    return {
      message: 'Designation deleted successfully',
    };
  }
}



