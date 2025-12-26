import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { UpdateCompanyUserDto } from './dto/update-company-user.dto';
import { FilterCompanyUsersDto } from './dto/filter-company-users.dto';
import { AuthService } from '../auth/auth.service';
import { PasswordGeneratorUtil } from '../../common/utils/password-generator.util';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}


  /**
   * Create a new user (Super Admin only)
   */
  async create(createUserDto: CreateUserDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException(`User with email "${createUserDto.email}" already exists`);
    }

    // Validate company exists if companyId is provided
    if (createUserDto.companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: createUserDto.companyId },
      });

      if (!company) {
        throw new NotFoundException(`Company with ID "${createUserDto.companyId}" not found`);
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        fullName: createUserDto.fullName,
        phone: createUserDto.phone,
        role: createUserDto.role || 'employee',
        companyId: createUserDto.companyId || null,
        avatarUrl: createUserDto.avatarUrl,
        isActive: createUserDto.isActive !== undefined ? createUserDto.isActive : true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        companyId: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
      },
    });

    return {
      message: 'User created successfully',
      data: user,
    };
  }

  /**
   * Get all users with filters and pagination (Super Admin only)
   */
  async findAll(filterDto: FilterUsersDto) {
    const {
      role,
      companyId,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    // Build where clause
    const where: any = {};
    if (role) where.role = role;
    if (companyId) where.companyId = companyId;
    if (isActive !== undefined) where.isActive = isActive;

    // Validate sortBy field
    const validSortFields = ['createdAt', 'email', 'fullName', 'lastLoginAt', 'updatedAt'];
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await this.prisma.user.count({ where });

    // Get users with pagination
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [validSortBy]: sortOrder,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        companyId: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
      },
    });

    return {
      message: 'Users retrieved successfully',
      data: users,
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
   * Get user by ID (Super Admin only)
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        companyId: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return {
      message: 'User retrieved successfully',
      data: user,
    };
  }

  /**
   * Update user (Super Admin only)
   * Cannot update companyId
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // Check if email is being changed and if it already exists
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailExists) {
        throw new ConflictException(`User with email "${updateUserDto.email}" already exists`);
      }
    }

    // Check if trying to change role or isActive for last super admin
    if (
      (updateUserDto.role !== undefined && updateUserDto.role !== existingUser.role) ||
      (updateUserDto.isActive !== undefined && updateUserDto.isActive !== existingUser.isActive)
    ) {
      await this.authService.ensureNotLastSuperAdmin(
        id,
        updateUserDto.role !== undefined ? 'change role of' : 'deactivate',
      );
    }

    // Build update data (exclude companyId)
    const updateData: any = {};
    if (updateUserDto.email !== undefined) updateData.email = updateUserDto.email;
    if (updateUserDto.fullName !== undefined) updateData.fullName = updateUserDto.fullName;
    if (updateUserDto.phone !== undefined) updateData.phone = updateUserDto.phone;
    if (updateUserDto.role !== undefined) updateData.role = updateUserDto.role;
    if (updateUserDto.avatarUrl !== undefined) updateData.avatarUrl = updateUserDto.avatarUrl;
    if (updateUserDto.isActive !== undefined) updateData.isActive = updateUserDto.isActive;

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        companyId: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
      },
    });

    return {
      message: 'User updated successfully',
      data: updatedUser,
    };
  }

  /**
   * Reset user password (Super Admin only)
   * Generates a random password and returns it
   */
  async resetPassword(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // Generate random password
    const newPassword = PasswordGeneratorUtil.generate(12);

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });

    // Log to terminal
    this.logger.log(`Password reset for user: ${user.email} (ID: ${user.id})`);
    this.logger.log(`New password: ${newPassword}`);
    this.logger.warn(`⚠️  User should change this password on first login!`);

    return {
      message: 'Password reset successfully',
      newPassword,
      userId: user.id,
      email: user.email,
    };
  }

  /**
   * Verify user belongs to company (company-scoped operations)
   */
  private async verifyUserBelongsToCompany(userId: string, companyId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, companyId: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    if (user.companyId !== companyId) {
      throw new ForbiddenException('You can only access users from your own company');
    }

    return user;
  }

  /**
   * Create a new user under company (Company Admin only)
   * Auto-assigns companyId from authenticated user
   */
  async createCompanyUser(createUserDto: CreateCompanyUserDto, companyId: string) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException(`User with email "${createUserDto.email}" already exists`);
    }

    // Validate company exists and is active
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${companyId}" not found`);
    }

    if (company.status !== 'active') {
      throw new BadRequestException('Cannot create users for a suspended or archived company');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // Create user (auto-assign companyId, only allow company-level roles)
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        fullName: createUserDto.fullName,
        phone: createUserDto.phone,
        role: createUserDto.role || 'employee',
        companyId: companyId, // Auto-assigned from authenticated user
        avatarUrl: createUserDto.avatarUrl,
        isActive: createUserDto.isActive !== undefined ? createUserDto.isActive : true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        companyId: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'User created successfully',
      data: user,
    };
  }

  /**
   * Get all users from company with filters and pagination (Company Admin only)
   */
  async findAllCompanyUsers(filterDto: FilterCompanyUsersDto, companyId: string) {
    const {
      role,
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
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    // Validate sortBy field
    const validSortFields = ['createdAt', 'email', 'fullName', 'lastLoginAt', 'updatedAt'];
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await this.prisma.user.count({ where });

    // Get users with pagination
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [validSortBy]: sortOrder,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        companyId: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Company users retrieved successfully',
      data: users,
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
   * Update user in company (Company Admin only)
   * Cannot update email or companyId
   */
  async updateCompanyUser(id: string, updateUserDto: UpdateCompanyUserDto, companyId: string) {
    // Verify user belongs to company
    await this.verifyUserBelongsToCompany(id, companyId);

    // Get existing user
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // Build update data (exclude email and companyId)
    const updateData: any = {};
    if (updateUserDto.fullName !== undefined) updateData.fullName = updateUserDto.fullName;
    if (updateUserDto.phone !== undefined) updateData.phone = updateUserDto.phone;
    if (updateUserDto.role !== undefined) {
      // Only allow company-level roles
      if (!['hr_manager', 'manager', 'employee'].includes(updateUserDto.role)) {
        throw new BadRequestException('Invalid role. Only hr_manager, manager, or employee roles are allowed.');
      }
      updateData.role = updateUserDto.role;
    }
    if (updateUserDto.avatarUrl !== undefined) updateData.avatarUrl = updateUserDto.avatarUrl;
    if (updateUserDto.isActive !== undefined) updateData.isActive = updateUserDto.isActive;

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        companyId: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'User updated successfully',
      data: updatedUser,
    };
  }

  /**
   * Reset user password in company (Company Admin only)
   * Generates a random password and returns it
   */
  async resetCompanyUserPassword(id: string, companyId: string) {
    // Verify user belongs to company
    await this.verifyUserBelongsToCompany(id, companyId);

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // Generate random password
    const newPassword = PasswordGeneratorUtil.generate(12);

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });

    // Log to terminal
    this.logger.log(`Password reset for company user: ${user.email} (ID: ${user.id}, Company: ${companyId})`);
    this.logger.log(`New password: ${newPassword}`);
    this.logger.warn(`⚠️  User should change this password on first login!`);

    return {
      message: 'Password reset successfully',
      newPassword,
      userId: user.id,
      email: user.email,
    };
  }
}

