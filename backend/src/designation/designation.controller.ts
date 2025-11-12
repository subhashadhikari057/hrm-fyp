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
import { DesignationService } from './designation.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { FilterDesignationsDto } from './dto/filter-designations.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Company Admin - Designations')
@Controller('company/designations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
@Roles('company_admin', 'hr_manager')
export class DesignationController {
  constructor(private readonly designationService: DesignationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new designation (Company Admin / HR Manager only)' })
  @ApiResponse({
    status: 201,
    description: 'Designation created successfully',
    schema: {
      example: {
        message: 'Designation created successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Software Engineer',
          code: 'SE',
          description: 'Responsible for developing and maintaining software applications',
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
  @ApiResponse({ status: 409, description: 'Conflict - Designation name or code already exists in your company' })
  async create(@Body() createDesignationDto: CreateDesignationDto, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.designationService.create(createDesignationDto, companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all designations from your company with filters and pagination (Company Admin / HR Manager only)' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], example: 'desc' })
  @ApiResponse({
    status: 200,
    description: 'Designations retrieved successfully',
    schema: {
      example: {
        message: 'Designations retrieved successfully',
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Software Engineer',
            code: 'SE',
            description: 'Responsible for developing and maintaining software applications',
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
  async findAll(@Query() filterDto: FilterDesignationsDto, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.designationService.findAll(filterDto, companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get designation by ID (Company Admin / HR Manager only)' })
  @ApiParam({ name: 'id', description: 'Designation ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'Designation retrieved successfully',
    schema: {
      example: {
        message: 'Designation retrieved successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Software Engineer',
          code: 'SE',
          description: 'Responsible for developing and maintaining software applications',
          isActive: true,
          companyId: 'company-uuid',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin or HR Manager role required or designation does not belong to your company' })
  @ApiResponse({ status: 404, description: 'Designation not found' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.designationService.findOne(id, companyId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update designation (Company Admin / HR Manager only)' })
  @ApiParam({ name: 'id', description: 'Designation ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'Designation updated successfully',
    schema: {
      example: {
        message: 'Designation updated successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Senior Software Engineer',
          code: 'SSE',
          description: 'Updated description',
          isActive: true,
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin or HR Manager role required or designation does not belong to your company' })
  @ApiResponse({ status: 404, description: 'Designation not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Designation name or code already exists in your company' })
  async update(@Param('id') id: string, @Body() updateDesignationDto: UpdateDesignationDto, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.designationService.update(id, updateDesignationDto, companyId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete designation (Company Admin / HR Manager only)' })
  @ApiParam({ name: 'id', description: 'Designation ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'Designation deleted successfully',
    schema: {
      example: {
        message: 'Designation deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin or HR Manager role required or designation does not belong to your company' })
  @ApiResponse({ status: 404, description: 'Designation not found' })
  async remove(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.designationService.remove(id, companyId);
  }
}



