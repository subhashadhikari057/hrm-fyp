import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';
import { FilterEmployeesDto } from './dto/filter-employees.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { employeeImageStorage, employeeImageFileFilter, employeeImageLimits } from '../common/config/multer.config';
import { FileUploadUtil } from '../common/utils/file-upload.util';
import { unlinkSync } from 'fs';

@ApiTags('Company Admin - Employees')
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @Roles(UserRole.company_admin, UserRole.hr_manager)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: employeeImageStorage,
      fileFilter: employeeImageFileFilter,
      limits: employeeImageLimits,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new employee (Company Admin / HR Manager only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'john.doe@example.com' },
        password: { type: 'string', example: 'SecurePass123!' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        middleName: { type: 'string', example: 'Michael' },
        employeeCode: { type: 'string', example: 'EMP001', description: 'Auto-generated if not provided' },
        departmentId: { type: 'string', example: 'uuid' },
        designationId: { type: 'string', example: 'uuid' },
        workShiftId: { type: 'string', example: 'uuid' },
        employmentType: { type: 'string', enum: ['full_time', 'part_time', 'contract', 'intern'], example: 'full_time' },
        gender: { type: 'string', enum: ['male', 'female', 'other'], example: 'male' },
        dateOfBirth: { type: 'string', format: 'date-time', example: '1990-01-15T00:00:00.000Z' },
        joinDate: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        probationEnd: { type: 'string', format: 'date-time', example: '2024-04-01T00:00:00.000Z' },
        locationId: { type: 'string', example: 'uuid', description: 'For future CompanyLocation relation' },
        workEmail: { type: 'string', example: 'john.doe@company.com' },
        personalEmail: { type: 'string', example: 'john.doe.personal@gmail.com' },
        phone: { type: 'string', example: '+1234567890' },
        address: { type: 'string', example: '123 Main St, City, Country' },
        emergencyContactName: { type: 'string', example: 'Jane Doe' },
        emergencyContactPhone: { type: 'string', example: '+1234567891' },
        baseSalary: { type: 'number', example: 50000.00 },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Employee profile image (optional) - synced to User.avatarUrl',
        },
      },
      required: ['email', 'password', 'firstName', 'lastName'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Employee created successfully',
    schema: {
      example: {
        message: 'Employee created successfully',
        data: {
          id: 'uuid',
          employeeCode: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          status: 'active',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or company limit reached' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin or HR Manager role required' })
  @ApiResponse({ status: 409, description: 'Conflict - Email or employee code already exists' })
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @UploadedFile() image?: Express.Multer.File,
    @Request() req?: any,
  ) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }

    // Validate file if provided
    if (image) {
      FileUploadUtil.validateFile(image);
    }

    // Store relative path: employees/filename
    const imagePath = image ? `employees/${image.filename}` : undefined;
    const imageFilePath = image ? image.path : undefined;

    try {
      return await this.employeeService.create(createEmployeeDto, companyId, imagePath);
    } catch (error) {
      // If validation or transaction fails, delete the uploaded file
      if (imageFilePath) {
        try {
          unlinkSync(imageFilePath);
        } catch (deleteError) {
          console.error('Failed to delete uploaded file after error:', deleteError);
        }
      }
      throw error;
    }
  }

  @Get()
  @Roles(UserRole.company_admin, UserRole.hr_manager, UserRole.manager)
  @ApiOperation({ summary: 'Get all employees from your company with filters and pagination' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name or employee code' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'on_leave', 'terminated'] })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  @ApiQuery({ name: 'designationId', required: false, type: String })
  @ApiQuery({ name: 'workShiftId', required: false, type: String })
  @ApiQuery({ name: 'employmentType', required: false, enum: ['full_time', 'part_time', 'contract', 'intern'] })
  @ApiQuery({ name: 'joinDateFrom', required: false, type: String, format: 'date-time', description: 'Filter by join date from' })
  @ApiQuery({ name: 'joinDateTo', required: false, type: String, format: 'date-time', description: 'Filter by join date to' })
  @ApiQuery({ name: 'dateOfBirthFrom', required: false, type: String, format: 'date-time', description: 'Filter by date of birth from' })
  @ApiQuery({ name: 'dateOfBirthTo', required: false, type: String, format: 'date-time', description: 'Filter by date of birth to' })
  @ApiQuery({ name: 'minSalary', required: false, type: Number, description: 'Minimum base salary' })
  @ApiQuery({ name: 'maxSalary', required: false, type: Number, description: 'Maximum base salary' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], example: 'desc' })
  @ApiResponse({
    status: 200,
    description: 'Employees retrieved successfully',
    schema: {
      example: {
        message: 'Employees retrieved successfully',
        data: [
          {
            id: 'uuid',
            employeeCode: 'EMP001',
            firstName: 'John',
            lastName: 'Doe',
            status: 'active',
          },
        ],
        meta: {
          total: 10,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin, HR Manager, or Manager role required' })
  async findAll(@Query() filterDto: FilterEmployeesDto, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.employeeService.findAll(filterDto, companyId);
  }

  @Get('stats')
  @Roles(UserRole.company_admin, UserRole.hr_manager, UserRole.manager)
  @ApiOperation({ summary: 'Get employee statistics for your company (Company Admin / HR Manager / Manager only)' })
  @ApiResponse({
    status: 200,
    description: 'Employee statistics retrieved successfully',
    schema: {
      example: {
        message: 'Employee statistics retrieved successfully',
        data: {
          summary: {
            totalEmployees: 100,
            totalActive: 85,
            totalOnLeave: 5,
            totalTerminated: 10,
            newHiresThisMonth: 5,
            averageSalary: 55000.50,
          },
          byStatus: [
            { status: 'active', count: 85 },
            { status: 'on_leave', count: 5 },
            { status: 'terminated', count: 10 },
          ],
          byDepartment: [
            { departmentId: 'uuid', departmentName: 'Engineering', departmentCode: 'ENG', count: 30 },
          ],
          byDesignation: [
            { designationId: 'uuid', designationName: 'Software Engineer', designationCode: 'SE', count: 20 },
          ],
          byEmploymentType: [
            { employmentType: 'full_time', count: 70 },
            { employmentType: 'part_time', count: 10 },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin, HR Manager, or Manager role required' })
  async getStatistics(@Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.employeeService.getStatistics(companyId);
  }

  @Get('me')
  @Roles(UserRole.employee)
  @ApiOperation({ summary: 'Get your own employee profile (Employee only)' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    schema: {
      example: {
        message: 'Profile retrieved successfully',
        data: {
          id: 'uuid',
          employeeCode: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Employee role required' })
  @ApiResponse({ status: 404, description: 'Employee profile not found' })
  async getMyProfile(@Request() req: any) {
    return this.employeeService.getMyProfile(req.user.id);
  }

  @Get(':id')
  @Roles(UserRole.company_admin, UserRole.hr_manager, UserRole.manager)
  @ApiOperation({ summary: 'Get employee by ID (Company Admin / HR Manager / Manager only)' })
  @ApiParam({ name: 'id', description: 'Employee ID', example: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Employee retrieved successfully',
    schema: {
      example: {
        message: 'Employee retrieved successfully',
        data: {
          id: 'uuid',
          employeeCode: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Employee does not belong to your company' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.employeeService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.company_admin, UserRole.hr_manager)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: employeeImageStorage,
      fileFilter: employeeImageFileFilter,
      limits: employeeImageLimits,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update employee information (Company Admin / HR Manager only)' })
  @ApiParam({ name: 'id', description: 'Employee ID', example: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        middleName: { type: 'string', example: 'Michael' },
        departmentId: { type: 'string', example: 'uuid' },
        designationId: { type: 'string', example: 'uuid' },
        workShiftId: { type: 'string', example: 'uuid' },
        employmentType: { type: 'string', enum: ['full_time', 'part_time', 'contract', 'intern'] },
        gender: { type: 'string', enum: ['male', 'female', 'other'], example: 'male' },
        dateOfBirth: { type: 'string', format: 'date-time' },
        joinDate: { type: 'string', format: 'date-time' },
        probationEnd: { type: 'string', format: 'date-time' },
        locationId: { type: 'string', example: 'uuid' },
        workEmail: { type: 'string', example: 'john.doe@company.com' },
        personalEmail: { type: 'string', example: 'john.doe.personal@gmail.com' },
        phone: { type: 'string', example: '+1234567890' },
        address: { type: 'string', example: '123 Main St' },
        emergencyContactName: { type: 'string', example: 'Jane Doe' },
        emergencyContactPhone: { type: 'string', example: '+1234567891' },
        baseSalary: { type: 'number', example: 50000.00 },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Employee profile image (optional) - synced to User.avatarUrl',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Employee updated successfully',
    schema: {
      example: {
        message: 'Employee updated successfully',
        data: {
          id: 'uuid',
          firstName: 'John',
          lastName: 'Doe Updated',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Employee does not belong to your company' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @UploadedFile() image?: Express.Multer.File,
    @Request() req?: any,
  ) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }

    // Validate file if provided
    if (image) {
      FileUploadUtil.validateFile(image);
    }

    // Store relative path: employees/filename
    const imagePath = image ? `employees/${image.filename}` : undefined;
    const imageFilePath = image ? image.path : undefined;

    try {
      return await this.employeeService.update(id, updateEmployeeDto, companyId, imagePath);
    } catch (error) {
      // If validation fails, delete the uploaded file
      if (imageFilePath) {
        try {
          unlinkSync(imageFilePath);
        } catch (deleteError) {
          console.error('Failed to delete uploaded file after error:', deleteError);
        }
      }
      throw error;
    }
  }

  @Patch(':id/status')
  @Roles(UserRole.company_admin, UserRole.hr_manager)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update employee status (Company Admin / HR Manager only)' })
  @ApiParam({ name: 'id', description: 'Employee ID', example: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Employee status updated successfully',
    schema: {
      example: {
        message: 'Employee status updated successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Employee does not belong to your company' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateEmployeeStatusDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.employeeService.updateStatus(id, updateStatusDto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.company_admin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove employee (soft delete by default, Company Admin only)' })
  @ApiParam({ name: 'id', description: 'Employee ID', example: 'uuid' })
  @ApiQuery({ name: 'hardDelete', required: false, type: Boolean, description: 'Hard delete flag (default: false)' })
  @ApiResponse({
    status: 200,
    description: 'Employee removed successfully',
    schema: {
      example: {
        message: 'Employee removed successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin role required or employee does not belong to your company' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async remove(
    @Param('id') id: string,
    @Query('hardDelete') hardDelete?: string,
    @Request() req?: any,
  ) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    const shouldHardDelete = hardDelete === 'true';
    return this.employeeService.remove(id, companyId, shouldHardDelete);
  }
}
