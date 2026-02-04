import {
  Body,
  Controller,
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
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LeaveService } from './leave.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { FilterLeaveRequestsDto } from './dto/filter-leave-requests.dto';
import { ReviewLeaveRequestDto, RejectLeaveRequestDto } from './dto/review-leave-request.dto';

@ApiTags('Leave Requests - Employee')
@Controller('leave/requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class LeaveRequestEmployeeController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  @Roles('employee', 'manager', 'hr_manager', 'company_admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a leave request (self or on behalf with company role)' })
  @ApiResponse({ status: 201, description: 'Leave request submitted' })
  async create(@Body() dto: CreateLeaveRequestDto, @Request() req: any) {
    return this.leaveService.createRequest(dto, req.user);
  }

  @Get('me')
  @Roles('employee', 'manager', 'hr_manager', 'company_admin')
  @ApiOperation({ summary: 'List my leave requests' })
  async findMy(@Query() filter: FilterLeaveRequestsDto, @Request() req: any) {
    return this.leaveService.findMyRequests(filter, req.user);
  }

  @Get('me/:id')
  @Roles('employee', 'manager', 'hr_manager', 'company_admin')
  @ApiOperation({ summary: 'Get my leave request by ID' })
  async findMyById(@Param('id') id: string, @Request() req: any) {
    return this.leaveService.findMyRequestById(id, req.user);
  }

  @Patch('me/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles('employee', 'manager', 'hr_manager', 'company_admin')
  @ApiOperation({ summary: 'Cancel a pending leave request (self)' })
  async cancel(@Param('id') id: string, @Request() req: any) {
    return this.leaveService.cancelMyRequest(id, req.user);
  }
}

@ApiTags('Leave Requests - Admin')
@Controller('leave/requests/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class LeaveRequestAdminController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get()
  @Roles('company_admin', 'hr_manager', 'manager')
  @ApiOperation({ summary: 'List leave requests (company scope)' })
  async findAll(@Query() filter: FilterLeaveRequestsDto, @Request() req: any) {
    return this.leaveService.findAllRequests(filter, req.user);
  }

  @Get(':id')
  @Roles('company_admin', 'hr_manager', 'manager')
  @ApiOperation({ summary: 'Get leave request by ID (company scope)' })
  async findById(@Param('id') id: string, @Request() req: any) {
    return this.leaveService.findRequestByIdForReview(id, req.user);
  }

  @Patch(':id/approve')
  @Roles('company_admin', 'hr_manager', 'manager')
  @ApiOperation({ summary: 'Approve a leave request' })
  async approve(
    @Param('id') id: string,
    @Body() body: ReviewLeaveRequestDto,
    @Request() req: any,
  ) {
    return this.leaveService.approve(id, body, req.user);
  }

  @Patch(':id/reject')
  @Roles('company_admin', 'hr_manager', 'manager')
  @ApiOperation({ summary: 'Reject a leave request' })
  async reject(
    @Param('id') id: string,
    @Body() body: RejectLeaveRequestDto,
    @Request() req: any,
  ) {
    return this.leaveService.reject(id, body, req.user);
  }
}
