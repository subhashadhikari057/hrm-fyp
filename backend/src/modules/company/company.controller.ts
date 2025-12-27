import { Controller, Post, Get, Patch, Delete, Body, Param, HttpCode, HttpStatus, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth, ApiBody, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { unlinkSync } from 'fs';
import { CompanyService } from './company.service';
import { CreateCompanyWithAdminDto } from './dto/create-company-with-admin.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateCompanyStatusDto } from './dto/update-company-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileUploadUtil } from '../../common/utils/file-upload.util';
import { companyLogoStorage, companyLogoFileFilter, companyLogoLimits } from '../../common/config/multer.config';

@ApiTags('Companies')
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @Roles('super_admin')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: companyLogoStorage,
      fileFilter: companyLogoFileFilter,
      limits: companyLogoLimits,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new company with admin user (Super Admin only)' })
  @ApiBody({
    type: CreateCompanyWithAdminDto,
    description: 'Company and admin details. For multipart/form-data, use the schema below.',
    schema: {
      type: 'object',
      properties: {
        companyName: { type: 'string', example: 'Acme Corporation' },
        companyCode: { type: 'string', example: 'ACME001' },
        adminEmail: { type: 'string', example: 'admin@acme.com' },
        adminPassword: { type: 'string', example: 'AdminPassword123!' },
        adminFullName: { type: 'string', example: 'Jane Smith' },
        adminPhone: { type: 'string', example: '+1234567890' },
        industry: { type: 'string', example: 'Technology' },
        address: { type: 'string', example: '123 Main Street' },
        city: { type: 'string', example: 'New York' },
        country: { type: 'string', example: 'United States' },
        planExpiresAt: { type: 'string', format: 'date-time', example: '2025-12-31T23:59:59.000Z' },
        maxEmployees: { type: 'integer', example: 100 },
        logo: {
          type: 'string',
          format: 'binary',
          description: 'Company logo image file (optional)',
        },
      },
      required: [
        'companyName',
        'adminEmail',
        'adminPassword',
        'adminFullName',
        'adminPhone',
        'industry',
        'address',
        'city',
        'maxEmployees',
      ],
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Company and admin created successfully',
    schema: {
      example: {
        message: 'Company and admin created successfully',
        data: {
          company: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Acme Corporation',
            code: 'ACME001',
            status: 'active'
          },
          admin: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            email: 'admin@acme.com',
            fullName: 'Jane Smith',
            role: 'company_admin'
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin role required' })
  async createCompanyWithAdmin(
    @Body() createDto: CreateCompanyWithAdminDto,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    // Validate file if provided
    if (logo) {
      FileUploadUtil.validateFile(logo);
    }

    // Store relative path: companies/filename
    const logoPath = logo ? `companies/${logo.filename}` : undefined;
    const logoFilePath = logo ? logo.path : undefined;

    try {
      return await this.companyService.createCompanyWithAdmin(createDto, logoPath);
    } catch (error) {
      // If validation or transaction fails, delete the uploaded file
      if (logoFilePath) {
        try {
          unlinkSync(logoFilePath);
        } catch (deleteError) {
          // Ignore file deletion errors, but log them
          console.error('Failed to delete uploaded file after error:', deleteError);
        }
      }
      // Re-throw the original error
      throw error;
    }
  }

  @Get()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get all companies (Super Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns list of all companies',
    schema: {
      example: {
        message: 'Companies retrieved successfully',
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Acme Corporation',
            code: 'ACME001',
            status: 'active',
            userCount: 5,
            createdAt: '2024-01-01T00:00:00.000Z'
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin role required' })
  async findAll() {
    return this.companyService.findAll();
  }

  @Get(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get a company by ID (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Company ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns company details',
    schema: {
      example: {
        message: 'Company retrieved successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Acme Corporation',
          code: 'ACME001',
          status: 'active',
          userCount: 5,
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin role required' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('super_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update company status (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Company ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: UpdateCompanyStatusDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Company status updated successfully',
    schema: {
      example: {
        message: 'Company status updated successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Acme Corporation',
          code: 'ACME001',
          status: 'suspended',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin role required' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async updateStatus(@Param('id') id: string, @Body() updateDto: UpdateCompanyStatusDto) {
    return this.companyService.updateStatus(id, updateDto);
  }

  @Patch(':id')
  @Roles('super_admin')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: companyLogoStorage,
      fileFilter: companyLogoFileFilter,
      limits: companyLogoLimits,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update company details (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Company ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({
    type: UpdateCompanyDto,
    description: 'Company details to update. For multipart/form-data, use the schema below.',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Acme Corporation Updated' },
        code: { type: 'string', example: 'ACME002' },
        industry: { type: 'string', example: 'Technology' },
        address: { type: 'string', example: '123 Main Street' },
        city: { type: 'string', example: 'New York' },
        country: { type: 'string', example: 'United States' },
        planExpiresAt: { type: 'string', format: 'date-time', example: '2025-12-31T23:59:59.000Z' },
        maxEmployees: { type: 'integer', example: 100 },
        logo: {
          type: 'string',
          format: 'binary',
          description: 'Company logo image file (optional)',
        },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Company updated successfully',
    schema: {
      example: {
        message: 'Company updated successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Acme Corporation Updated',
          code: 'ACME002',
          logoUrl: 'companies/company-logo-1234567890.jpg',
          status: 'active',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin role required' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Company code already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCompanyDto,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    // Validate file if provided
    if (logo) {
      FileUploadUtil.validateFile(logo);
    }

    // Store relative path: companies/filename
    const logoPath = logo ? `companies/${logo.filename}` : undefined;
    const logoFilePath = logo ? logo.path : undefined;

    try {
      return await this.companyService.update(id, updateDto, logoPath);
    } catch (error) {
      // If validation or update fails, delete the uploaded file
      if (logoFilePath) {
        try {
          unlinkSync(logoFilePath);
        } catch (deleteError) {
          // Ignore file deletion errors, but log them
          console.error('Failed to delete uploaded file after error:', deleteError);
        }
      }
      // Re-throw the original error
      throw error;
    }
  }

  @Delete(':id')
  @Roles('super_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a company (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Company ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ 
    status: 200, 
    description: 'Company deleted successfully',
    schema: {
      example: {
        message: 'Company deleted successfully'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Company has users associated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin role required' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async remove(@Param('id') id: string) {
    return this.companyService.remove(id);
  }
}
