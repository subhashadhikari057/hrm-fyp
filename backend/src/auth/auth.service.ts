import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSuperAdminDto } from './dto/create-superadmin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async createSuperAdmin(createSuperAdminDto: CreateSuperAdminDto) {
    // Check if super admin already exists
    const existingSuperAdmin = await this.prisma.user.findFirst({
      where: {
        role: 'super_admin',
      },
    });

    if (existingSuperAdmin) {
      throw new ConflictException('Super admin already exists');
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
}

