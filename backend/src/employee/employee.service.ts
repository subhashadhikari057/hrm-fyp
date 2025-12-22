import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';
import { FilterEmployeesDto } from './dto/filter-employees.dto';
import { EmployeeStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { unlinkSync } from 'fs';
import { join } from 'path';
import { EmployeeCodeGeneratorUtil } from '../common/utils/employee-code-generator.util';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new employee (User + Employee in transaction)
   */
  async create(createEmployeeDto: CreateEmployeeDto, companyId: string, imagePath?: string) {
    // Validate company exists and is active
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${companyId}" not found`);
    }

    if (company.status !== 'active') {
      throw new BadRequestException('Cannot create employees for a suspended or archived company');
    }

    // Check maxEmployees limit (count only active employees)
    if (company.maxEmployees) {
      const currentActiveEmployeeCount = await this.prisma.employee.count({
        where: {
          companyId,
          status: 'active', // Only count active employees
        },
      });

      if (currentActiveEmployeeCount >= company.maxEmployees) {
        throw new BadRequestException(
          `Company has reached the maximum employee limit of ${company.maxEmployees}. Currently has ${currentActiveEmployeeCount} active employees.`,
        );
      }
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createEmployeeDto.email },
    });

    if (existingUser) {
      throw new ConflictException(`User with email "${createEmployeeDto.email}" already exists`);
    }

    // Auto-generate employee code if not provided
    let employeeCode = createEmployeeDto.employeeCode;
    if (!employeeCode) {
      employeeCode = await EmployeeCodeGeneratorUtil.generate(this.prisma, companyId);
    } else {
      // Check if provided employee code already exists in this company
      const existingEmployeeCode = await this.prisma.employee.findFirst({
        where: {
          companyId,
          employeeCode: createEmployeeDto.employeeCode,
        },
      });

      if (existingEmployeeCode) {
        throw new ConflictException(
          `Employee with code "${createEmployeeDto.employeeCode}" already exists in your company`,
        );
      }
    }

    // Validate department belongs to company (if provided)
    if (createEmployeeDto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: createEmployeeDto.departmentId },
      });

      if (!department) {
        throw new NotFoundException(`Department with ID "${createEmployeeDto.departmentId}" not found`);
      }

      if (department.companyId !== companyId) {
        throw new ForbiddenException('Department does not belong to your company');
      }

      if (!department.isActive) {
        throw new BadRequestException('Cannot assign employee to an inactive department');
      }
    }

    // Validate designation belongs to company (if provided)
    if (createEmployeeDto.designationId) {
      const designation = await this.prisma.designation.findUnique({
        where: { id: createEmployeeDto.designationId },
      });

      if (!designation) {
        throw new NotFoundException(`Designation with ID "${createEmployeeDto.designationId}" not found`);
      }

      if (designation.companyId !== companyId) {
        throw new ForbiddenException('Designation does not belong to your company');
      }

      if (!designation.isActive) {
        throw new BadRequestException('Cannot assign employee to an inactive designation');
      }
    }

    // Validate work shift belongs to company (if provided)
    if (createEmployeeDto.workShiftId) {
      const workShift = await this.prisma.workShift.findUnique({
        where: { id: createEmployeeDto.workShiftId },
      });

      if (!workShift) {
        throw new NotFoundException(`Work shift with ID "${createEmployeeDto.workShiftId}" not found`);
      }

      if (workShift.companyId !== companyId) {
        throw new ForbiddenException('Work shift does not belong to your company');
      }

      if (!workShift.isActive) {
        throw new BadRequestException('Cannot assign employee to an inactive work shift');
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createEmployeeDto.password, saltRounds);

    // Build full name with middle name if provided
    const fullNameParts = [createEmployeeDto.firstName];
    if (createEmployeeDto.middleName) {
      fullNameParts.push(createEmployeeDto.middleName);
    }
    fullNameParts.push(createEmployeeDto.lastName);
    const fullName = fullNameParts.join(' ');

    // Create User and Employee in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create User
      const user = await tx.user.create({
        data: {
          email: createEmployeeDto.email,
          password: hashedPassword,
          fullName: fullName,
          phone: createEmployeeDto.phone,
          avatarUrl: imagePath, // Sync employee image to user avatar
          role: 'employee',
          companyId: companyId,
          isActive: true,
        },
      });

      // Create Employee
      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          companyId: companyId,
          employeeCode: employeeCode,
          firstName: createEmployeeDto.firstName,
          lastName: createEmployeeDto.lastName,
          middleName: createEmployeeDto.middleName,
          departmentId: createEmployeeDto.departmentId,
          designationId: createEmployeeDto.designationId,
          workShiftId: createEmployeeDto.workShiftId,
          gender: createEmployeeDto.gender,
          dateOfBirth: createEmployeeDto.dateOfBirth,
          joinDate: createEmployeeDto.joinDate || new Date(),
          probationEnd: createEmployeeDto.probationEnd,
          employmentType: createEmployeeDto.employmentType,
          locationId: createEmployeeDto.locationId,
          workEmail: createEmployeeDto.workEmail,
          personalEmail: createEmployeeDto.personalEmail,
          phone: createEmployeeDto.phone,
          address: createEmployeeDto.address,
          emergencyContactName: createEmployeeDto.emergencyContactName,
          emergencyContactPhone: createEmployeeDto.emergencyContactPhone,
          baseSalary: createEmployeeDto.baseSalary,
          status: 'active',
          imageUrl: imagePath,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          designation: {
            select: {
              id: true,
              name: true,
              code: true,
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

      return employee;
    });

    return {
      message: 'Employee created successfully',
      data: result,
    };
  }

  /**
   * Get all employees from company with filters and pagination
   */
  async findAll(filterDto: FilterEmployeesDto, companyId: string) {
    const {
      search,
      status,
      departmentId,
      designationId,
      workShiftId,
      employmentType,
      joinDateFrom,
      joinDateTo,
      dateOfBirthFrom,
      dateOfBirthTo,
      minSalary,
      maxSalary,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    // Build where clause (always filter by companyId)
    const where: any = {
      companyId: companyId,
    };

    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (designationId) where.designationId = designationId;
    if (workShiftId) where.workShiftId = workShiftId;
    if (employmentType) where.employmentType = employmentType;

    // Date range filters
    if (joinDateFrom || joinDateTo) {
      where.joinDate = {};
      if (joinDateFrom) where.joinDate.gte = joinDateFrom;
      if (joinDateTo) where.joinDate.lte = joinDateTo;
    }

    if (dateOfBirthFrom || dateOfBirthTo) {
      where.dateOfBirth = {};
      if (dateOfBirthFrom) where.dateOfBirth.gte = dateOfBirthFrom;
      if (dateOfBirthTo) where.dateOfBirth.lte = dateOfBirthTo;
    }

    // Salary range filters
    if (minSalary !== undefined || maxSalary !== undefined) {
      where.baseSalary = {};
      if (minSalary !== undefined) where.baseSalary.gte = minSalary;
      if (maxSalary !== undefined) where.baseSalary.lte = maxSalary;
    }

    // Search by name or employee code
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Validate sortBy field
    const validSortFields = ['createdAt', 'firstName', 'lastName', 'employeeCode', 'joinDate'];
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await this.prisma.employee.count({ where });

    // Get employees with pagination
    const employees = await this.prisma.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [validSortBy]: sortOrder,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        designation: {
          select: {
            id: true,
            name: true,
            code: true,
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
      message: 'Employees retrieved successfully',
      data: employees,
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
   * Get employee by ID
   */
  async findOne(id: string, companyId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        designation: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        workShift: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    // Verify employee belongs to company
    if (employee.companyId !== companyId) {
      throw new ForbiddenException('You can only access employees from your own company');
    }

    return {
      message: 'Employee retrieved successfully',
      data: employee,
    };
  }

  /**
   * Update employee information
   */
  async update(id: string, updateEmployeeDto: UpdateEmployeeDto, companyId: string, imagePath?: string) {
    // Check if employee exists and belongs to company
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!existingEmployee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    if (existingEmployee.companyId !== companyId) {
      throw new ForbiddenException('You can only update employees from your own company');
    }

    // Validate department belongs to company (if provided)
    if (updateEmployeeDto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: updateEmployeeDto.departmentId },
      });

      if (!department) {
        throw new NotFoundException(`Department with ID "${updateEmployeeDto.departmentId}" not found`);
      }

      if (department.companyId !== companyId) {
        throw new ForbiddenException('Department does not belong to your company');
      }

      if (!department.isActive) {
        throw new BadRequestException('Cannot assign employee to an inactive department');
      }
    }

    // Validate designation belongs to company (if provided)
    if (updateEmployeeDto.designationId) {
      const designation = await this.prisma.designation.findUnique({
        where: { id: updateEmployeeDto.designationId },
      });

      if (!designation) {
        throw new NotFoundException(`Designation with ID "${updateEmployeeDto.designationId}" not found`);
      }

      if (designation.companyId !== companyId) {
        throw new ForbiddenException('Designation does not belong to your company');
      }

      if (!designation.isActive) {
        throw new BadRequestException('Cannot assign employee to an inactive designation');
      }
    }

    // Validate work shift belongs to company (if provided)
    if (updateEmployeeDto.workShiftId) {
      const workShift = await this.prisma.workShift.findUnique({
        where: { id: updateEmployeeDto.workShiftId },
      });

      if (!workShift) {
        throw new NotFoundException(`Work shift with ID "${updateEmployeeDto.workShiftId}" not found`);
      }

      if (workShift.companyId !== companyId) {
        throw new ForbiddenException('Work shift does not belong to your company');
      }

      if (!workShift.isActive) {
        throw new BadRequestException('Cannot assign employee to an inactive work shift');
      }
    }

    // Build update data
    const updateData: any = {};
    if (updateEmployeeDto.firstName !== undefined) updateData.firstName = updateEmployeeDto.firstName;
    if (updateEmployeeDto.lastName !== undefined) updateData.lastName = updateEmployeeDto.lastName;
    if (updateEmployeeDto.middleName !== undefined) updateData.middleName = updateEmployeeDto.middleName;
    if (updateEmployeeDto.departmentId !== undefined) updateData.departmentId = updateEmployeeDto.departmentId;
    if (updateEmployeeDto.designationId !== undefined) updateData.designationId = updateEmployeeDto.designationId;
    if (updateEmployeeDto.workShiftId !== undefined) updateData.workShiftId = updateEmployeeDto.workShiftId;
    if (updateEmployeeDto.employmentType !== undefined) updateData.employmentType = updateEmployeeDto.employmentType;
    if (updateEmployeeDto.gender !== undefined) updateData.gender = updateEmployeeDto.gender;
    if (updateEmployeeDto.dateOfBirth !== undefined) updateData.dateOfBirth = updateEmployeeDto.dateOfBirth;
    if (updateEmployeeDto.joinDate !== undefined) updateData.joinDate = updateEmployeeDto.joinDate;
    if (updateEmployeeDto.probationEnd !== undefined) updateData.probationEnd = updateEmployeeDto.probationEnd;
    if (updateEmployeeDto.locationId !== undefined) updateData.locationId = updateEmployeeDto.locationId;
    if (updateEmployeeDto.workEmail !== undefined) updateData.workEmail = updateEmployeeDto.workEmail;
    if (updateEmployeeDto.personalEmail !== undefined) updateData.personalEmail = updateEmployeeDto.personalEmail;
    if (updateEmployeeDto.phone !== undefined) updateData.phone = updateEmployeeDto.phone;
    if (updateEmployeeDto.address !== undefined) updateData.address = updateEmployeeDto.address;
    if (updateEmployeeDto.emergencyContactName !== undefined) updateData.emergencyContactName = updateEmployeeDto.emergencyContactName;
    if (updateEmployeeDto.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = updateEmployeeDto.emergencyContactPhone;
    if (updateEmployeeDto.baseSalary !== undefined) updateData.baseSalary = updateEmployeeDto.baseSalary;
    if (imagePath !== undefined) updateData.imageUrl = imagePath;

    // Build user update data
    const userUpdateData: any = {};

    // Update User fullName if firstName, middleName, or lastName changed
    if (updateEmployeeDto.firstName !== undefined || updateEmployeeDto.middleName !== undefined || updateEmployeeDto.lastName !== undefined) {
      const firstName = updateEmployeeDto.firstName ?? existingEmployee.firstName;
      const middleName = updateEmployeeDto.middleName ?? existingEmployee.middleName;
      const lastName = updateEmployeeDto.lastName ?? existingEmployee.lastName;
      
      const fullNameParts = [firstName];
      if (middleName) {
        fullNameParts.push(middleName);
      }
      fullNameParts.push(lastName);
      userUpdateData.fullName = fullNameParts.join(' ');
    }

    // Update User phone if changed
    if (updateEmployeeDto.phone !== undefined) {
      userUpdateData.phone = updateEmployeeDto.phone;
    }

    // Sync imageUrl to User.avatarUrl if image is uploaded
    if (imagePath !== undefined) {
      userUpdateData.avatarUrl = imagePath;
    }

    // Update User if any changes
    if (Object.keys(userUpdateData).length > 0) {
      await this.prisma.user.update({
        where: { id: existingEmployee.userId },
        data: userUpdateData,
      });
    }

    // Delete old image if new image is uploaded
    if (imagePath && existingEmployee.imageUrl) {
      const oldImagePath = join(process.cwd(), 'uploads', existingEmployee.imageUrl);
      try {
        unlinkSync(oldImagePath);
      } catch (error) {
        // Ignore file deletion errors
        console.error('Failed to delete old employee image:', error);
      }
    }

    // Update employee
    const updatedEmployee = await this.prisma.employee.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        designation: {
          select: {
            id: true,
            name: true,
            code: true,
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
      message: 'Employee updated successfully',
      data: updatedEmployee,
    };
  }

  /**
   * Update employee status
   */
  async updateStatus(id: string, updateStatusDto: UpdateEmployeeStatusDto, companyId: string) {
    // Check if employee exists and belongs to company
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    if (employee.companyId !== companyId) {
      throw new ForbiddenException('You can only update employees from your own company');
    }

    // Update employee status and user isActive if terminated
    await this.prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id },
        data: { status: updateStatusDto.status },
      });

      // If terminated, set user.isActive = false
      if (updateStatusDto.status === 'terminated') {
        await tx.user.update({
          where: { id: employee.userId },
          data: { isActive: false },
        });
      }
    });

    return {
      message: 'Employee status updated successfully',
    };
  }

  /**
   * Delete employee (soft delete: set status = terminated and User.isActive = false)
   */
  async remove(id: string, companyId: string, hardDelete: boolean = false) {
    // Check if employee exists and belongs to company
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    if (employee.companyId !== companyId) {
      throw new ForbiddenException('You can only delete employees from your own company');
    }

    if (hardDelete) {
      // Hard delete: Delete employee and user records
      // Delete image file if exists
      if (employee.imageUrl) {
        const imagePath = join(process.cwd(), 'uploads', employee.imageUrl);
        try {
          unlinkSync(imagePath);
        } catch (error) {
          console.error('Failed to delete employee image:', error);
        }
      }

      await this.prisma.employee.delete({
        where: { id },
      });
    } else {
      // Soft delete: Set status = terminated and User.isActive = false
      await this.prisma.$transaction(async (tx) => {
        await tx.employee.update({
          where: { id },
          data: { status: 'terminated' },
        });

        await tx.user.update({
          where: { id: employee.userId },
          data: { isActive: false },
        });
      });
    }

    return {
      message: 'Employee removed successfully',
    };
  }

  /**
   * Get employee statistics for a company
   */
  async getStatistics(companyId: string) {
    // Total employees by status
    const totalByStatus = await this.prisma.employee.groupBy({
      by: ['status'],
      where: { companyId },
      _count: true,
    });

    // Total employees by department
    const totalByDepartment = await this.prisma.employee.groupBy({
      by: ['departmentId'],
      where: {
        companyId,
        status: 'active',
      },
      _count: true,
    });

    // Get department names
    const departmentIds = totalByDepartment.map((d) => d.departmentId).filter(Boolean);
    const departments = await this.prisma.department.findMany({
      where: {
        id: { in: departmentIds as string[] },
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    const departmentStats = totalByDepartment.map((stat) => {
      const dept = departments.find((d) => d.id === stat.departmentId);
      return {
        departmentId: stat.departmentId,
        departmentName: dept?.name || 'Unassigned',
        departmentCode: dept?.code || null,
        count: stat._count,
      };
    });

    // Total employees by designation
    const totalByDesignation = await this.prisma.employee.groupBy({
      by: ['designationId'],
      where: {
        companyId,
        status: 'active',
      },
      _count: true,
    });

    // Get designation names
    const designationIds = totalByDesignation.map((d) => d.designationId).filter(Boolean);
    const designations = await this.prisma.designation.findMany({
      where: {
        id: { in: designationIds as string[] },
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    const designationStats = totalByDesignation.map((stat) => {
      const desig = designations.find((d) => d.id === stat.designationId);
      return {
        designationId: stat.designationId,
        designationName: desig?.name || 'Unassigned',
        designationCode: desig?.code || null,
        count: stat._count,
      };
    });

    // Total employees by employment type
    const totalByEmploymentType = await this.prisma.employee.groupBy({
      by: ['employmentType'],
      where: {
        companyId,
        status: 'active',
      },
      _count: true,
    });

    // New hires this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newHiresThisMonth = await this.prisma.employee.count({
      where: {
        companyId,
        joinDate: {
          gte: startOfMonth,
        },
      },
    });

    // Total active employees
    const totalActive = await this.prisma.employee.count({
      where: {
        companyId,
        status: 'active',
      },
    });

    // Total employees
    const totalEmployees = await this.prisma.employee.count({
      where: { companyId },
    });

    // Average salary (for active employees with salary)
    const employeesWithSalary = await this.prisma.employee.findMany({
      where: {
        companyId,
        status: 'active',
        baseSalary: { not: null },
      },
      select: {
        baseSalary: true,
      },
    });

    const averageSalary =
      employeesWithSalary.length > 0
        ? employeesWithSalary.reduce((sum, emp) => sum + Number(emp.baseSalary || 0), 0) /
          employeesWithSalary.length
        : 0;

    return {
      message: 'Employee statistics retrieved successfully',
      data: {
        summary: {
          totalEmployees,
          totalActive,
          totalOnLeave: totalByStatus.find((s) => s.status === 'on_leave')?._count || 0,
          totalTerminated: totalByStatus.find((s) => s.status === 'terminated')?._count || 0,
          newHiresThisMonth,
          averageSalary: Math.round(averageSalary * 100) / 100,
        },
        byStatus: totalByStatus.map((stat) => ({
          status: stat.status,
          count: stat._count,
        })),
        byDepartment: departmentStats,
        byDesignation: designationStats,
        byEmploymentType: totalByEmploymentType.map((stat) => ({
          employmentType: stat.employmentType,
          count: stat._count,
        })),
      },
    };
  }

  /**
   * Get employee's own profile (for employee role)
   */
  async getMyProfile(userId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        designation: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        workShift: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    return {
      message: 'Profile retrieved successfully',
      data: employee,
    };
  }
}
