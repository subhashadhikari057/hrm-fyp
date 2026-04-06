import { ApiPropertyOptional } from '@nestjs/swagger';
import { PayslipStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterPayslipsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by payroll period ID' })
  @IsOptional()
  @IsString()
  payrollPeriodId?: string;

  @ApiPropertyOptional({ description: 'Filter by employee ID (admin only)' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ enum: PayslipStatus, description: 'Filter by payslip status' })
  @IsOptional()
  @IsEnum(PayslipStatus)
  status?: PayslipStatus;

  @ApiPropertyOptional({ description: 'Filter by fiscal year label', example: '2081/82' })
  @IsOptional()
  @IsString()
  fiscalYearLabel?: string;
}
