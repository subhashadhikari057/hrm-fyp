import { Injectable, ConflictException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyWithAdminDto } from './dto/create-company-with-admin.dto';
import { UpdateCompanyStatusDto } from './dto/update-company-status.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { FileUploadUtil } from '../../common/utils/file-upload.util';
import { buildPaginationMeta, getPagination } from '../../common/utils/pagination.util';
import { unlinkSync } from 'fs';
import { join } from 'path';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new company with its first company admin user
   * This is a transactional operation - both company and admin are created together
   */
  async createCompanyWithAdmin(createDto: CreateCompanyWithAdminDto, logoPath?: string) {
    // Validate all constraints BEFORE transaction to avoid file upload issues
    // Check if company name already exists
    const existingCompany = await this.prisma.company.findFirst({
      where: { name: createDto.companyName },
    });

    if (existingCompany) {
      throw new ConflictException(`Company with name "${createDto.companyName}" already exists`);
    }

    // Check if company code already exists (if provided)
    if (createDto.companyCode) {
      const existingCode = await this.prisma.company.findUnique({
        where: { code: createDto.companyCode },
      });

      if (existingCode) {
        throw new ConflictException(`Company code "${createDto.companyCode}" already exists`);
      }
    }

    // Check if admin email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createDto.adminEmail },
    });

    if (existingUser) {
      throw new ConflictException(`User with email "${createDto.adminEmail}" already exists`);
    }

    // Hash admin password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createDto.adminPassword, saltRounds);

    // Use Prisma transaction to ensure both company and admin are created together
    const result = await this.prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: createDto.companyName,
          code: createDto.companyCode,
          logoUrl: logoPath || null,
          industry: createDto.industry,
          address: createDto.address,
          city: createDto.city,
          country: createDto.country,
          planExpiresAt: createDto.planExpiresAt || null,
          maxEmployees: createDto.maxEmployees,
          status: 'active',
        },
      });

      // Create company admin user
      const admin = await tx.user.create({
        data: {
          email: createDto.adminEmail,
          password: hashedPassword,
          fullName: createDto.adminFullName,
          phone: createDto.adminPhone,
          role: 'company_admin',
          companyId: company.id,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          companyId: true,
          isActive: true,
          createdAt: true,
        },
      });

      return { company, admin };
    });

    return {
      message: 'Company and admin created successfully',
      data: {
        company: {
          id: result.company.id,
          name: result.company.name,
          code: result.company.code,
          logoUrl: result.company.logoUrl,
          industry: result.company.industry,
          address: result.company.address,
          city: result.company.city,
          country: result.company.country,
          planExpiresAt: result.company.planExpiresAt,
          maxEmployees: result.company.maxEmployees,
          status: result.company.status,
          createdAt: result.company.createdAt,
        },
        admin: result.admin,
      },
    };
  }

  /**
   * Get all companies (Super Admin only)
   */
  async findAll(page?: number, limit?: number, search?: string, status?: string, sortBy?: string, sortOrder?: string) {
    const { skip, take, page: currentPage, limit: currentLimit } = getPagination(page, limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const validSortFields = ['createdAt', 'name', 'code', 'status', 'updatedAt'];
    const validSortBy = validSortFields.includes(sortBy ?? '') ? (sortBy as string) : 'createdAt';
    const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const [total, companies] = await Promise.all([
      this.prisma.company.count({ where }),
      this.prisma.company.findMany({
        where,
        select: {
          id: true,
          name: true,
          code: true,
          logoUrl: true,
          industry: true,
          address: true,
          city: true,
          country: true,
          planExpiresAt: true,
          maxEmployees: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          [validSortBy]: validSortOrder,
        },
        skip,
        take,
      }),
    ]);

    return {
      message: 'Companies retrieved successfully',
      data: companies.map((company) => ({
        id: company.id,
        name: company.name,
        code: company.code,
        logoUrl: company.logoUrl,
        industry: company.industry,
        address: company.address,
        city: company.city,
        country: company.country,
        planExpiresAt: company.planExpiresAt,
        maxEmployees: company.maxEmployees,
        status: company.status,
        userCount: company._count.users,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      })),
      meta: buildPaginationMeta(total, currentPage, currentLimit),
    };
  }

  /**
   * Get company by ID
   */
  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        logoUrl: true,
        industry: true,
        address: true,
        city: true,
        country: true,
        planExpiresAt: true,
        maxEmployees: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    const admin = await this.prisma.user.findFirst({
      where: {
        companyId: company.id,
        role: 'company_admin',
      },
      select: {
        fullName: true,
        email: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      message: 'Company retrieved successfully',
      data: {
        id: company.id,
        name: company.name,
        code: company.code,
        logoUrl: company.logoUrl,
        industry: company.industry,
        address: company.address,
        city: company.city,
        country: company.country,
        planExpiresAt: company.planExpiresAt,
        maxEmployees: company.maxEmployees,
        status: company.status,
        userCount: company._count.users,
        adminName: admin?.fullName || admin?.email || null,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      },
    };
  }

  /**
   * Update company details (Super Admin only)
   */
  async update(id: string, updateDto: UpdateCompanyDto, logoPath?: string) {
    // Check if company exists
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    // Check if company code already exists (if code is being updated)
    if (updateDto.code && updateDto.code !== company.code) {
      const existingCode = await this.prisma.company.findUnique({
        where: { code: updateDto.code },
      });

      if (existingCode) {
        throw new ConflictException(`Company code "${updateDto.code}" already exists`);
      }
    }

    // Delete old logo if new logo is being uploaded
    if (logoPath && company.logoUrl) {
      try {
        // Extract filename from path (could be "companies/filename.jpg" or just "filename.jpg")
        const fileName = company.logoUrl.includes('/') 
          ? company.logoUrl.split('/').pop() || '' 
          : company.logoUrl;
        const oldLogoPath = join(process.cwd(), 'uploads', 'companies', fileName);
        try {
          unlinkSync(oldLogoPath);
        } catch (error) {
          // File might not exist, ignore error
        }
      } catch (error) {
        // Ignore file deletion errors
      }
    }

    // Build update data (only include fields that are provided)
    const updateData: any = {};
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.code !== undefined) updateData.code = updateDto.code;
    if (logoPath !== undefined) updateData.logoUrl = logoPath;
    if (updateDto.industry !== undefined) updateData.industry = updateDto.industry;
    if (updateDto.address !== undefined) updateData.address = updateDto.address;
    if (updateDto.city !== undefined) updateData.city = updateDto.city;
    if (updateDto.country !== undefined) updateData.country = updateDto.country;
    if (updateDto.planExpiresAt !== undefined) {
      updateData.planExpiresAt = updateDto.planExpiresAt || null;
    }
    if (updateDto.maxEmployees !== undefined) updateData.maxEmployees = updateDto.maxEmployees;

    // Update company
    const updatedCompany = await this.prisma.company.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        code: true,
        logoUrl: true,
        industry: true,
        address: true,
        city: true,
        country: true,
        planExpiresAt: true,
        maxEmployees: true,
        status: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Company updated successfully',
      data: updatedCompany,
    };
  }

  /**
   * Update company status (Super Admin only)
   */
  async updateStatus(id: string, updateDto: UpdateCompanyStatusDto) {
    // Check if company exists
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    // Update status
    const updatedCompany = await this.prisma.company.update({
      where: { id },
      data: {
        status: updateDto.status,
      },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Company status updated successfully',
      data: updatedCompany,
    };
  }

  /**
   * Delete company (Super Admin only)
   * Note: Company can only be deleted if it has no users
   */
  async remove(id: string) {
    // Check if company exists
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    // Check if company has users
    if (company._count.users > 0) {
      throw new BadRequestException(
        `Cannot delete company. It has ${company._count.users} user(s) associated. Please remove all users first or archive the company instead.`,
      );
    }

    // Delete logo file if exists
    if (company.logoUrl) {
      try {
        // Extract filename from path (could be "companies/filename.jpg" or just "filename.jpg")
        const fileName = company.logoUrl.includes('/') 
          ? company.logoUrl.split('/').pop() || '' 
          : company.logoUrl;
        const logoPath = join(process.cwd(), 'uploads', 'companies', fileName);
        try {
          unlinkSync(logoPath);
        } catch (error) {
          // File might not exist, ignore error
        }
      } catch (error) {
        // Ignore file deletion errors
      }
    }

    // Delete company
    await this.prisma.company.delete({
      where: { id },
    });

    return {
      message: 'Company deleted successfully',
    };
  }
}
