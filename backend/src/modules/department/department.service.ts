import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { FilterDepartmentsDto } from './dto/filter-departments.dto';
import { buildPaginationMeta, getPagination } from '../../common/utils/pagination.util';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new department (Company Admin / HR Manager only)
   * Auto-assigns companyId from authenticated user
   */
  async create(createDepartmentDto: CreateDepartmentDto, companyId: string) {
    // Validate company exists and is active
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${companyId}" not found`);
    }

    if (company.status !== 'active') {
      throw new BadRequestException('Cannot create departments for a suspended or archived company');
    }

    // Check if department name already exists in this company
    const existingName = await this.prisma.department.findFirst({
      where: {
        companyId,
        name: createDepartmentDto.name,
      },
    });

    if (existingName) {
      throw new ConflictException(`Department with name "${createDepartmentDto.name}" already exists in your company`);
    }

    // Check if department code already exists in this company (if code provided)
    if (createDepartmentDto.code) {
      const existingCode = await this.prisma.department.findFirst({
        where: {
          companyId,
          code: createDepartmentDto.code,
        },
      });

      if (existingCode) {
        throw new ConflictException(`Department with code "${createDepartmentDto.code}" already exists in your company`);
      }
    }

    // Create department
    const department = await this.prisma.department.create({
      data: {
        name: createDepartmentDto.name,
        code: createDepartmentDto.code,
        description: createDepartmentDto.description,
        isActive: createDepartmentDto.isActive !== undefined ? createDepartmentDto.isActive : true,
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
      message: 'Department created successfully',
      data: department,
    };
  }

  /**
   * Get all departments from company with filters and pagination
   */
  async findAll(filterDto: FilterDepartmentsDto, companyId: string) {
    const {
      search,
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
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Validate sortBy field
    const validSortFields = ['createdAt', 'name', 'code', 'updatedAt'];
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const { skip, take, page: currentPage, limit: currentLimit } = getPagination(page, limit);

    // Get total count for pagination
    const total = await this.prisma.department.count({ where });

    // Get departments with pagination
    const departments = await this.prisma.department.findMany({
      where,
      skip,
      take,
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
      message: 'Departments retrieved successfully',
      data: departments,
      meta: buildPaginationMeta(total, currentPage, currentLimit),
    };
  }

  /**
   * Get department by ID (Company Admin / HR Manager only)
   */
  async findOne(id: string, companyId: string) {
    const department = await this.prisma.department.findUnique({
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

    if (!department) {
      throw new NotFoundException(`Department with ID "${id}" not found`);
    }

    // Verify department belongs to company
    if (department.companyId !== companyId) {
      throw new ForbiddenException('You can only access departments from your own company');
    }

    return {
      message: 'Department retrieved successfully',
      data: department,
    };
  }

  /**
   * Update department (Company Admin / HR Manager only)
   */
  async update(id: string, updateDepartmentDto: UpdateDepartmentDto, companyId: string) {
    // Check if department exists and belongs to company
    const existingDepartment = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!existingDepartment) {
      throw new NotFoundException(`Department with ID "${id}" not found`);
    }

    if (existingDepartment.companyId !== companyId) {
      throw new ForbiddenException('You can only update departments from your own company');
    }

    // Check if new name already exists in this company (if name is being updated)
    if (updateDepartmentDto.name && updateDepartmentDto.name !== existingDepartment.name) {
      const existingName = await this.prisma.department.findFirst({
        where: {
          companyId,
          name: updateDepartmentDto.name,
        },
      });

      if (existingName) {
        throw new ConflictException(`Department with name "${updateDepartmentDto.name}" already exists in your company`);
      }
    }

    // Check if new code already exists in this company (if code is being updated)
    if (updateDepartmentDto.code && updateDepartmentDto.code !== existingDepartment.code) {
      const existingCode = await this.prisma.department.findFirst({
        where: {
          companyId,
          code: updateDepartmentDto.code,
        },
      });

      if (existingCode) {
        throw new ConflictException(`Department with code "${updateDepartmentDto.code}" already exists in your company`);
      }
    }

    // Build update data
    const updateData: any = {};
    if (updateDepartmentDto.name !== undefined) updateData.name = updateDepartmentDto.name;
    if (updateDepartmentDto.code !== undefined) updateData.code = updateDepartmentDto.code;
    if (updateDepartmentDto.description !== undefined) updateData.description = updateDepartmentDto.description;
    if (updateDepartmentDto.isActive !== undefined) updateData.isActive = updateDepartmentDto.isActive;

    // Update department
    const updatedDepartment = await this.prisma.department.update({
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
      message: 'Department updated successfully',
      data: updatedDepartment,
    };
  }

  /**
   * Delete department (Company Admin / HR Manager only)
   */
  async remove(id: string, companyId: string) {
    // Check if department exists and belongs to company
    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID "${id}" not found`);
    }

    if (department.companyId !== companyId) {
      throw new ForbiddenException('You can only delete departments from your own company');
    }

    // Check if any employee references this department
    const employeeCount = await this.prisma.employee.count({
      where: { departmentId: id },
    });

    if (employeeCount > 0) {
      throw new BadRequestException(
        `Cannot delete department. ${employeeCount} employee(s) are assigned to this department. Please reassign employees before deleting.`,
      );
    }

    // Delete department
    await this.prisma.department.delete({
      where: { id },
    });

    return {
      message: 'Department deleted successfully',
    };
  }
}
