import {
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
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreatePayrollPeriodDto } from './dto/create-payroll-period.dto';
import { FilterPayrollPeriodsDto } from './dto/filter-payroll-periods.dto';
import { FilterPayslipsDto } from './dto/filter-payslips.dto';
import { UpdatePayrollSettingsDto } from './dto/update-payroll-settings.dto';
import { PayrollService } from './payroll.service';

@ApiTags('Payroll - Admin/HR')
@Controller('payroll/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class PayrollAdminController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('periods')
  @Roles('company_admin', 'hr_manager')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create payroll period' })
  async createPeriod(@Body() dto: CreatePayrollPeriodDto, @Request() req: any) {
    return this.payrollService.createPayrollPeriod(dto, req.user);
  }

  @Get('periods')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'List payroll periods' })
  async findPeriods(@Query() filter: FilterPayrollPeriodsDto, @Request() req: any) {
    return this.payrollService.findAllPeriods(filter, req.user);
  }

  @Get('periods/:periodId')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'Get payroll period detail' })
  async findPeriodById(@Param('periodId') periodId: string, @Request() req: any) {
    return this.payrollService.findPeriodById(periodId, req.user);
  }

  @Post('periods/:periodId/generate')
  @Roles('company_admin', 'hr_manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate payslips for payroll period' })
  async generate(@Param('periodId') periodId: string, @Request() req: any) {
    return this.payrollService.generatePayslips(periodId, req.user);
  }

  @Post('periods/:periodId/finalize')
  @Roles('company_admin', 'hr_manager')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finalize payroll period' })
  async finalize(@Param('periodId') periodId: string, @Request() req: any) {
    return this.payrollService.finalizePeriod(periodId, req.user);
  }

  @Get('payslips')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'List payslips in company scope' })
  async findPayslips(@Query() filter: FilterPayslipsDto, @Request() req: any) {
    return this.payrollService.findAdminPayslips(filter, req.user);
  }

  @Get('summary')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'Get payroll summary for company scope' })
  async getSummary(@Query('fiscalYearLabel') fiscalYearLabel: string | undefined, @Request() req: any) {
    return this.payrollService.getAdminPayrollSummary(req.user, fiscalYearLabel);
  }

  @Get('settings')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'Get payroll settings for company scope' })
  async getSettings(@Request() req: any) {
    return this.payrollService.getPayrollSettings(req.user);
  }

  @Patch('settings')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'Update payroll settings for company scope' })
  async updateSettings(@Body() dto: UpdatePayrollSettingsDto, @Request() req: any) {
    return this.payrollService.updatePayrollSettings(dto, req.user);
  }

  @Get('payslips/:payslipId')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'Get payslip detail' })
  async findPayslipById(@Param('payslipId') payslipId: string, @Request() req: any) {
    return this.payrollService.findAdminPayslipById(payslipId, req.user);
  }
}
