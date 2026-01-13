import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AttendanceRegularizationService } from './attendance-regularization.service';
import { CreateRegularizationDto } from './dto/create-regularization.dto';
import { FilterRegularizationsDto } from './dto/filter-regularizations.dto';
import { ReviewRegularizationDto, RejectRegularizationDto } from './dto/review-regularization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Attendance Regularization - Employee')
@Controller('attendance/regularizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class AttendanceRegularizationEmployeeController {
  constructor(private readonly service: AttendanceRegularizationService) {}

  @Post()
  @Roles('employee', 'manager', 'hr_manager', 'company_admin')
  @ApiOperation({ summary: 'Create a regularization request (self or on behalf with company role)' })
  async create(@Body() dto: CreateRegularizationDto, @Request() req: any) {
    return this.service.create(dto, req.user);
  }

  @Get('me')
  @Roles('employee', 'manager', 'hr_manager', 'company_admin')
  @ApiOperation({ summary: 'List my regularization requests' })
  async findMy(@Query() filter: FilterRegularizationsDto, @Request() req: any) {
    return this.service.findMyRequests(filter, req.user);
  }

  @Get('me/:id')
  @Roles('employee', 'manager', 'hr_manager', 'company_admin')
  @ApiOperation({ summary: 'Get my regularization request by ID' })
  async findMyById(@Param('id') id: string, @Request() req: any) {
    return this.service.findMyRequestById(id, req.user);
  }

  @Patch('me/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles('employee', 'manager', 'hr_manager', 'company_admin')
  @ApiOperation({ summary: 'Cancel a pending regularization (self)' })
  async cancel(@Param('id') id: string, @Request() req: any) {
    return this.service.cancelMyRequest(id, req.user);
  }
}

@ApiTags('Attendance Regularization - Admin')
@Controller('attendance/regularizations/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class AttendanceRegularizationAdminController {
  constructor(private readonly service: AttendanceRegularizationService) {}

  @Get()
  @Roles('company_admin', 'hr_manager', 'manager')
  @ApiOperation({ summary: 'List regularization requests (company scope)' })
  async findAll(@Query() filter: FilterRegularizationsDto, @Request() req: any) {
    return this.service.findAll(filter, req.user);
  }

  @Get(':id')
  @Roles('company_admin', 'hr_manager', 'manager')
  @ApiOperation({ summary: 'Get regularization by ID (company scope)' })
  async findById(@Param('id') id: string, @Request() req: any) {
    return this.service.findByIdForReview(id, req.user);
  }

  @Patch(':id/approve')
  @Roles('company_admin', 'hr_manager', 'manager')
  @ApiOperation({ summary: 'Approve a regularization request' })
  async approve(
    @Param('id') id: string,
    @Body() body: ReviewRegularizationDto,
    @Request() req: any,
  ) {
    return this.service.approve(id, body, req.user);
  }

  @Patch(':id/reject')
  @Roles('company_admin', 'hr_manager', 'manager')
  @ApiOperation({ summary: 'Reject a regularization request' })
  async reject(
    @Param('id') id: string,
    @Body() body: RejectRegularizationDto,
    @Request() req: any,
  ) {
    return this.service.reject(id, body, req.user);
  }
}
