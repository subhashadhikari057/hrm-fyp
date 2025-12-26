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
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { FilterDepartmentsDto } from './dto/filter-departments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Company Admin - Departments')
@Controller('company/departments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
@Roles('company_admin', 'hr_manager')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new department (Company Admin / HR Manager only)' })
  @ApiResponse({
    status: 201,
    description: 'Department created successfully',
    schema: {
      example: {
        message: 'Department created successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Human Resources',
          code: 'HR',
          description: 'Handles recruitment and employee relations',
          isActive: true,
          companyId: 'company-uuid',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or company is suspended/archived' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin or HR Manager role required' })
  @ApiResponse({ status: 409, description: 'Conflict - Department name or code already exists in your company' })
  async create(@Body() createDepartmentDto: CreateDepartmentDto, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.departmentService.create(createDepartmentDto, companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments from your company with filters and pagination (Company Admin / HR Manager only)' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], example: 'desc' })
  @ApiResponse({
    status: 200,
    description: 'Departments retrieved successfully',
    schema: {
      example: {
        message: 'Departments retrieved successfully',
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Human Resources',
            code: 'HR',
            description: 'Handles recruitment and employee relations',
            isActive: true,
            companyId: 'company-uuid',
            createdAt: '2024-01-01T00:00:00.000Z',
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
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin or HR Manager role required' })
  async findAll(@Query() filterDto: FilterDepartmentsDto, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.departmentService.findAll(filterDto, companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID (Company Admin / HR Manager only)' })
  @ApiParam({ name: 'id', description: 'Department ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'Department retrieved successfully',
    schema: {
      example: {
        message: 'Department retrieved successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Human Resources',
          code: 'HR',
          description: 'Handles recruitment and employee relations',
          isActive: true,
          companyId: 'company-uuid',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin or HR Manager role required or department does not belong to your company' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.departmentService.findOne(id, companyId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update department (Company Admin / HR Manager only)' })
  @ApiParam({ name: 'id', description: 'Department ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'Department updated successfully',
    schema: {
      example: {
        message: 'Department updated successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Human Resources Updated',
          code: 'HR',
          description: 'Updated description',
          isActive: true,
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin or HR Manager role required or department does not belong to your company' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Department name or code already exists in your company' })
  async update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.departmentService.update(id, updateDepartmentDto, companyId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete department (Company Admin / HR Manager only)' })
  @ApiParam({ name: 'id', description: 'Department ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'Department deleted successfully',
    schema: {
      example: {
        message: 'Department deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin or HR Manager role required or department does not belong to your company' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async remove(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.departmentService.remove(id, companyId);
  }
}

