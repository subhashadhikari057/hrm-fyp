import { ApiPropertyOptional } from '@nestjs/swagger';
import { PayrollPeriodStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterPayrollPeriodsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: PayrollPeriodStatus, description: 'Filter by payroll period status' })
  @IsOptional()
  @IsEnum(PayrollPeriodStatus)
  status?: PayrollPeriodStatus;

  @ApiPropertyOptional({ description: 'Filter by fiscal year label', example: '2081/82' })
  @IsOptional()
  @IsString()
  fiscalYearLabel?: string;

  @ApiPropertyOptional({ description: 'Filter by Gregorian period year', example: 2024 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  periodYear?: number;

  @ApiPropertyOptional({ description: 'Filter by Gregorian period month', example: 7, minimum: 1, maximum: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth?: number;
}
