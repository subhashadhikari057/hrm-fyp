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
import { WorkShiftService } from './workshift.service';
import { CreateWorkShiftDto } from './dto/create-workshift.dto';
import { UpdateWorkShiftDto } from './dto/update-workshift.dto';
import { FilterWorkShiftsDto } from './dto/filter-workshifts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Company Admin - Work Shifts')
@Controller('company/workshifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
@Roles('company_admin', 'hr_manager')
export class WorkShiftController {
  constructor(private readonly workShiftService: WorkShiftService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new work shift (Company Admin / HR Manager only)' })
  @ApiResponse({
    status: 201,
    description: 'Work shift created successfully',
    schema: {
      example: {
        message: 'Work shift created successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Morning Shift',
          code: 'MS',
          description: 'Morning shift from 9 AM to 5 PM',
          startTime: '1970-01-01T09:00:00.000Z',
          endTime: '1970-01-01T17:00:00.000Z',
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
  @ApiResponse({ status: 409, description: 'Conflict - Work shift name or code already exists in your company' })
  async create(@Body() createWorkShiftDto: CreateWorkShiftDto, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.workShiftService.create(createWorkShiftDto, companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all work shifts from your company with filters and pagination (Company Admin / HR Manager only)' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], example: 'desc' })
  @ApiResponse({
    status: 200,
    description: 'Work shifts retrieved successfully',
    schema: {
      example: {
        message: 'Work shifts retrieved successfully',
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Morning Shift',
            code: 'MS',
            description: 'Morning shift from 9 AM to 5 PM',
            startTime: '1970-01-01T09:00:00.000Z',
            endTime: '1970-01-01T17:00:00.000Z',
            isActive: true,
            companyId: 'company-uuid',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        meta: {
          total: 20,
          page: 1,
          limit: 10,
          totalPages: 2,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin or HR Manager role required' })
  async findAll(@Query() filterDto: FilterWorkShiftsDto, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.workShiftService.findAll(filterDto, companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get work shift by ID (Company Admin / HR Manager only)' })
  @ApiParam({ name: 'id', description: 'Work shift ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'Work shift retrieved successfully',
    schema: {
      example: {
        message: 'Work shift retrieved successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Morning Shift',
          code: 'MS',
          description: 'Morning shift from 9 AM to 5 PM',
          startTime: '1970-01-01T09:00:00.000Z',
          endTime: '1970-01-01T17:00:00.000Z',
          isActive: true,
          companyId: 'company-uuid',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin or HR Manager role required or work shift does not belong to your company' })
  @ApiResponse({ status: 404, description: 'Work shift not found' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.workShiftService.findOne(id, companyId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update work shift (Company Admin / HR Manager only)' })
  @ApiParam({ name: 'id', description: 'Work shift ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'Work shift updated successfully',
    schema: {
      example: {
        message: 'Work shift updated successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Evening Shift',
          code: 'ES',
          description: 'Updated description',
          startTime: '1970-01-01T13:00:00.000Z',
          endTime: '1970-01-01T21:00:00.000Z',
          isActive: true,
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin or HR Manager role required or work shift does not belong to your company' })
  @ApiResponse({ status: 404, description: 'Work shift not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Work shift name or code already exists in your company' })
  async update(@Param('id') id: string, @Body() updateWorkShiftDto: UpdateWorkShiftDto, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.workShiftService.update(id, updateWorkShiftDto, companyId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete work shift (Company Admin / HR Manager only)' })
  @ApiParam({ name: 'id', description: 'Work shift ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'Work shift deleted successfully',
    schema: {
      example: {
        message: 'Work shift deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin or HR Manager role required or work shift does not belong to your company' })
  @ApiResponse({ status: 404, description: 'Work shift not found' })
  async remove(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.workShiftService.remove(id, companyId);
  }
}
