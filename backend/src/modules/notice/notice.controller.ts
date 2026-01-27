import {
  Body,
  Controller,
  Delete,
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
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NoticeService } from './notice.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { FilterNoticesDto } from './dto/filter-notices.dto';
import { FilterMyNoticesDto } from './dto/filter-my-notices.dto';

@ApiTags('Notices - Employee')
@Controller('notices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class NoticeEmployeeController {
  constructor(private readonly noticeService: NoticeService) {}

  @Get()
  @Roles('employee', 'manager', 'hr_manager', 'company_admin', 'super_admin')
  @ApiOperation({ summary: 'List published notices visible to the current employee' })
  async listMy(@Query() filter: FilterMyNoticesDto, @Request() req: any) {
    return this.noticeService.listMy(filter, req.user);
  }

  @Get(':id')
  @Roles('employee', 'manager', 'hr_manager', 'company_admin', 'super_admin')
  @ApiOperation({ summary: 'Get a published notice visible to the current employee' })
  async getMy(@Param('id') id: string, @Request() req: any) {
    return this.noticeService.getMyById(id, req.user);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @Roles('employee', 'manager', 'hr_manager', 'company_admin', 'super_admin')
  @ApiOperation({ summary: 'Mark a notice as read' })
  async markRead(@Param('id') id: string, @Request() req: any) {
    return this.noticeService.markRead(id, req.user);
  }
}

@ApiTags('Notices - Admin')
@Controller('admin/notices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class NoticeAdminController {
  constructor(private readonly noticeService: NoticeService) {}

  @Post()
  @Roles('company_admin', 'hr_manager', 'manager', 'super_admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new notice (Company Admin / HR Manager / Manager)' })
  @ApiBody({
    description: 'Notice details',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Holiday Announcement' },
        body: { type: 'string', example: 'Office will be closed on Friday.' },
        priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH'], example: 'NORMAL' },
        status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], example: 'DRAFT' },
        publishAt: { type: 'string', format: 'date-time' },
        expiresAt: { type: 'string', format: 'date-time' },
        isCompanyWide: { type: 'boolean', example: true },
        audiences: {
          type: 'array',
          description: 'Audience objects (required if isCompanyWide is false)',
          items: { type: 'object' },
        },
      },
      required: ['title', 'body'],
    },
  })
  @ApiResponse({ status: 201, description: 'Notice created successfully' })
  async create(@Body() dto: CreateNoticeDto, @Request() req?: any) {
    return this.noticeService.create(dto, req.user);
  }

  @Get()
  @Roles('company_admin', 'hr_manager', 'manager', 'super_admin')
  @ApiOperation({ summary: 'List notices in company scope (Company Admin / HR Manager / Manager)' })
  async listAdmin(@Query() filter: FilterNoticesDto, @Request() req: any) {
    return this.noticeService.listAdmin(filter, req.user);
  }

  @Get(':id')
  @Roles('company_admin', 'hr_manager', 'manager', 'super_admin')
  @ApiOperation({ summary: 'Get notice by ID in company scope' })
  async getAdminById(@Param('id') id: string, @Request() req: any) {
    return this.noticeService.getAdminById(id, req.user);
  }

  @Patch(':id')
  @Roles('company_admin', 'hr_manager', 'manager', 'super_admin')
  @ApiOperation({ summary: 'Update notice details' })
  @ApiBody({
    description: 'Notice update fields',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Updated title' },
        body: { type: 'string', example: 'Updated body' },
        priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH'] },
        status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
        publishAt: { type: 'string', format: 'date-time' },
        expiresAt: { type: 'string', format: 'date-time' },
        isCompanyWide: { type: 'boolean' },
        audiences: {
          type: 'array',
          description: 'Audience objects (replaces existing)',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Notice updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateNoticeDto, @Request() req?: any) {
    return this.noticeService.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles('company_admin', 'hr_manager', 'manager', 'super_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a notice' })
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.noticeService.remove(id, req.user);
  }
}
