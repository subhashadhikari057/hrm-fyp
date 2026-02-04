import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LeaveService } from './leave.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { FilterLeaveTypesDto } from './dto/filter-leave-types.dto';

@ApiTags('Company Admin - Leave Types')
@Controller('leave/types')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class LeaveTypeController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  @Roles('company_admin', 'hr_manager')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new leave type (Company Admin / HR Manager only)' })
  @ApiResponse({ status: 201, description: 'Leave type created successfully' })
  async create(@Body() dto: CreateLeaveTypeDto, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.leaveService.createLeaveType(dto, companyId);
  }

  @Get()
  @Roles('company_admin', 'hr_manager', 'manager', 'employee')
  @ApiOperation({ summary: 'Get all leave types for your company' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], example: 'desc' })
  @ApiResponse({ status: 200, description: 'Leave types retrieved successfully' })
  async findAll(@Query() filterDto: FilterLeaveTypesDto, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.leaveService.findAllLeaveTypes(filterDto, companyId);
  }

  @Get(':id')
  @Roles('company_admin', 'hr_manager', 'manager', 'employee')
  @ApiOperation({ summary: 'Get leave type by ID' })
  @ApiParam({ name: 'id', description: 'Leave type ID', example: 'leave-type-uuid' })
  @ApiResponse({ status: 200, description: 'Leave type retrieved successfully' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.leaveService.findLeaveType(id, companyId);
  }

  @Patch(':id')
  @Roles('company_admin', 'hr_manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update leave type (Company Admin / HR Manager only)' })
  @ApiParam({ name: 'id', description: 'Leave type ID', example: 'leave-type-uuid' })
  @ApiResponse({ status: 200, description: 'Leave type updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateLeaveTypeDto, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.leaveService.updateLeaveType(id, dto, companyId);
  }

  @Delete(':id')
  @Roles('company_admin', 'hr_manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete leave type (Company Admin / HR Manager only)' })
  @ApiParam({ name: 'id', description: 'Leave type ID', example: 'leave-type-uuid' })
  @ApiResponse({ status: 200, description: 'Leave type deleted successfully' })
  async remove(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.leaveService.removeLeaveType(id, companyId);
  }
}
