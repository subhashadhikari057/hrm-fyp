import { Injectable, ConflictException, BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSuperAdminDto } from './dto/create-superadmin.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Check if this is the last super admin
   * Throws ForbiddenException if it's the last one
   */
  async ensureNotLastSuperAdmin(userId: string, action: string = 'perform this action') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'super_admin') {
      return; // Not a super admin, no restriction
    }

    const superAdminCount = await this.prisma.user.count({
      where: {
        role: 'super_admin',
        isActive: true,
      },
    });

    if (superAdminCount <= 1) {
      throw new ForbiddenException(
        `Cannot ${action} on the last super admin. At least one active super admin must exist in the system.`,
      );
    }
  }

  /**
   * Create super admin
   * IMPORTANT: Super admin can only be created once in the system.
   * The first super admin cannot be deleted, deactivated, or have their role changed.
   */
  async createSuperAdmin(createSuperAdminDto: CreateSuperAdminDto) {
    // Check if super admin already exists
    // This ensures only ONE super admin can exist in the system
    const existingSuperAdmin = await this.prisma.user.findFirst({
      where: {
        role: 'super_admin',
      },
    });

    if (existingSuperAdmin) {
      throw new ConflictException('Super admin already exists. Only one super admin can be created in the system.');
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: createSuperAdminDto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createSuperAdminDto.password, saltRounds);

    // Create super admin
    const superAdmin = await this.prisma.user.create({
      data: {
        email: createSuperAdminDto.email,
        password: hashedPassword,
        fullName: createSuperAdminDto.fullName,
        phone: createSuperAdminDto.phone,
        role: 'super_admin',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        // Don't return password
      },
    });

    return {
      message: 'Super admin created successfully',
      user: superAdmin,
    };
  }

  /**
   * Check if user can be deleted
   * Prevents deletion of the last super admin
   */
  async canDeleteUser(userId: string): Promise<boolean> {
    try {
      await this.ensureNotLastSuperAdmin(userId, 'delete');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user can be deactivated
   * Prevents deactivation of the last super admin
   */
  async canDeactivateUser(userId: string): Promise<boolean> {
    try {
      await this.ensureNotLastSuperAdmin(userId, 'deactivate');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user role can be changed
   * Prevents changing role of the last super admin
   */
  async canChangeRole(userId: string, newRole: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // If changing FROM super_admin, check if it's the last one
    if (user?.role === 'super_admin' && newRole !== 'super_admin') {
      try {
        await this.ensureNotLastSuperAdmin(userId, 'change role of');
        return true;
      } catch (error) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate user credentials for login
   */
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        company: {
          select: {
            id: true,
            status: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive. Please contact administrator.');
    }

    // Check company status for company-level users (not super_admin)
    if (user.companyId && user.company) {
      if (user.company.status === 'suspended') {
        throw new UnauthorizedException('Your company account has been suspended. Please contact support.');
      }
      if (user.company.status === 'archived') {
        throw new UnauthorizedException('Your company account has been archived.');
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      companyId: user.companyId,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  /**
   * Login user and generate JWT token
   */
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const token = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      user,
      access_token: token, // Also return in response for reference (cookie is set in controller)
    };
  }

  /**
   * Get user by ID (used by JWT strategy)
   */
  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        companyId: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            status: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    // Get user with password and company status
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        isActive: true,
        companyId: true,
        company: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Check company status for company-level users (not super_admin)
    if (user.companyId && user.company) {
      if (user.company.status === 'suspended') {
        throw new UnauthorizedException('Your company account has been suspended. Please contact support.');
      }
      if (user.company.status === 'archived') {
        throw new UnauthorizedException('Your company account has been archived.');
      }
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(
      changePasswordDto.newPassword,
      user.password,
    );

    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
      },
    });

    return {
      message: 'Password changed successfully',
    };
  }
}

