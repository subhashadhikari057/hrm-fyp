import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FilterPayslipsDto } from './dto/filter-payslips.dto';
import { PayrollService } from './payroll.service';

@ApiTags('Payroll - Employee/Manager')
@Controller('payroll/me')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class PayrollEmployeeController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('payslips')
  @Roles('employee', 'manager')
  @ApiOperation({ summary: 'List my payslips' })
  async findMyPayslips(@Query() filter: FilterPayslipsDto, @Request() req: any) {
    return this.payrollService.findMyPayslips(filter, req.user);
  }

  @Get('summary')
  @Roles('employee', 'manager')
  @ApiOperation({ summary: 'Get my payroll summary' })
  async getMySummary(@Query('fiscalYearLabel') fiscalYearLabel: string | undefined, @Request() req: any) {
    return this.payrollService.getMyPayrollSummary(req.user, fiscalYearLabel);
  }

  @Get('payslips/:payslipId')
  @Roles('employee', 'manager')
  @ApiOperation({ summary: 'Get my payslip detail' })
  async findMyPayslipById(@Param('payslipId') payslipId: string, @Request() req: any) {
    return this.payrollService.findMyPayslipById(payslipId, req.user);
  }
}
