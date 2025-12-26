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
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { FilterAttendanceDto } from './dto/filter-attendance.dto';
import {
  ManualAttendanceDto,
  UpdateAttendanceDto,
} from './dto/manual-attendance.dto';
import { ImportAttendanceSummaryDto } from './dto/import-attendance.dto';
import {
  attendanceCsvFileFilter,
  attendanceCsvLimits,
  attendanceCsvStorage,
} from '../../common/config/multer.config';

@ApiTags('Company Admin - Attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @Roles(
    UserRole.employee,
    UserRole.company_admin,
    UserRole.hr_manager,
    UserRole.manager,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Check-in for current employee (or specified employee for admin/HR/manager)',
  })
  @ApiBody({ type: CheckInDto, required: false })
  @ApiResponse({
    status: 201,
    description: 'Check-in recorded successfully',
    schema: {
      example: {
        message: 'Check-in recorded successfully',
        data: {
          id: 'attendance-id',
          employeeId: 'employee-id',
          date: '2025-01-10T00:00:00.000Z',
          checkInTime: '2025-01-10T09:05:00.000Z',
          status: 'PRESENT',
        },
      },
    },
  })
  async checkIn(@Body() dto: CheckInDto, @Req() req: any) {
    return this.attendanceService.checkIn(req.user, dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('check-out')
  @Roles(
    UserRole.employee,
    UserRole.company_admin,
    UserRole.hr_manager,
    UserRole.manager,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Check-out for current employee (or specified employee for admin/HR/manager)',
  })
  @ApiBody({ type: CheckOutDto, required: false })
  @ApiResponse({
    status: 201,
    description: 'Check-out recorded successfully',
    schema: {
      example: {
        message: 'Check-out recorded successfully',
        data: {
          id: 'attendance-id',
          employeeId: 'employee-id',
          date: '2025-01-10T00:00:00.000Z',
          checkInTime: '2025-01-10T09:05:00.000Z',
          checkOutTime: '2025-01-10T18:00:00.000Z',
          totalWorkMinutes: 480,
          lateMinutes: 5,
          overtimeMinutes: 0,
          status: 'PRESENT',
        },
      },
    },
  })
  async checkOut(@Body() dto: CheckOutDto, @Req() req: any) {
    return this.attendanceService.checkOut(req.user, dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Get('me')
  @Roles(UserRole.employee)
  @ApiOperation({
    summary: 'Get current employee attendance history (Employee only)',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Start date (inclusive)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'End date (inclusive)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Attendance retrieved successfully',
  })
  async getMyAttendance(
    @Query() filter: FilterAttendanceDto,
    @Req() req: any,
  ) {
    return this.attendanceService.getMyAttendance(req.user, filter);
  }

  @Get()
  @Roles(UserRole.company_admin, UserRole.hr_manager, UserRole.manager)
  @ApiOperation({
    summary:
      'Get attendance list for your company with filters and pagination (Company Admin / HR Manager / Manager)',
  })
  @ApiResponse({
    status: 200,
    description: 'Attendance records retrieved successfully',
  })
  async findAll(@Query() filter: FilterAttendanceDto, @Req() req: any) {
    return this.attendanceService.findAll(req.user, filter);
  }

  @Get(':id')
  @Roles(UserRole.company_admin, UserRole.hr_manager, UserRole.manager)
  @ApiOperation({
    summary:
      'Get single attendance record by ID (Company Admin / HR Manager / Manager)',
  })
  @ApiParam({
    name: 'id',
    description: 'Attendance record ID',
    example: 'attendance-id',
  })
  @ApiResponse({
    status: 200,
    description: 'Attendance record retrieved successfully',
  })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.attendanceService.findOne(req.user, id);
  }

  @Post('manual')
  @Roles(UserRole.company_admin, UserRole.hr_manager)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Create or overwrite an attendance record manually (Company Admin / HR Manager)',
  })
  @ApiBody({ type: ManualAttendanceDto })
  @ApiResponse({
    status: 201,
    description: 'Attendance record saved successfully',
  })
  async createManual(@Body() dto: ManualAttendanceDto, @Req() req: any) {
    return this.attendanceService.createManual(req.user, dto);
  }

  @Patch(':id')
  @Roles(UserRole.company_admin, UserRole.hr_manager)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Update an attendance record manually (Company Admin / HR Manager)',
  })
  @ApiParam({
    name: 'id',
    description: 'Attendance record ID',
    example: 'attendance-id',
  })
  @ApiBody({ type: UpdateAttendanceDto })
  @ApiResponse({
    status: 200,
    description: 'Attendance record updated successfully',
  })
  async updateManual(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
    @Req() req: any,
  ) {
    return this.attendanceService.updateManual(req.user, id, dto);
  }

  @Get('export')
  @Roles(UserRole.company_admin, UserRole.hr_manager, UserRole.manager)
  @ApiOperation({
    summary: 'Export attendance records as CSV (Company Admin / HR / Manager)',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV export',
  })
  async export(
    @Query() filter: FilterAttendanceDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const csv = await this.attendanceService.exportCsv(req.user, filter);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="attendance-export.csv"',
    );
    res.send(csv);
  }

  @Post('import')
  @Roles(UserRole.company_admin, UserRole.hr_manager)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: attendanceCsvStorage,
      fileFilter: attendanceCsvFileFilter,
      limits: attendanceCsvLimits,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Import attendance from CSV (Company Admin / HR Manager). Columns: employeeCode OR employeeEmail, date, checkInTime, checkOutTime, shiftName(optional), notes(optional)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file to upload',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Attendance import completed',
    type: ImportAttendanceSummaryDto,
  })
  async import(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ): Promise<{ message: string; data: ImportAttendanceSummaryDto }> {
    return this.attendanceService.importCsv(req.user, file);
  }

  @Post('mark-absent')
  @Roles(UserRole.company_admin, UserRole.hr_manager)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Mark employees without attendance as ABSENT for a specific date (weekdays only)',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    description: 'Target date in YYYY-MM-DD or ISO format',
  })
  @ApiResponse({
    status: 200,
    description: 'Absents marked successfully or skipped',
  })
  async markAbsent(@Query('date') dateStr: string, @Req() req: any) {
    const date = new Date(dateStr);
    return this.attendanceService.markAbsents(req.user, date);
  }
}



