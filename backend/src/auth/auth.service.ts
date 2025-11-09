import { Injectable, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSuperAdminDto } from './dto/create-superadmin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

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
}

