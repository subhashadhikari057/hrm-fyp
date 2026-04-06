import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreatePayrollPeriodDto {
  @ApiProperty({ description: 'Fiscal year label', example: '2081/82' })
  @IsString()
  fiscalYearLabel!: string;

  @ApiPropertyOptional({ description: 'Nepali period year (BS)', example: 2082 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  bsPeriodYear?: number;

  @ApiPropertyOptional({ description: 'Nepali period month (1-12)', example: 12 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  bsPeriodMonth?: number;

  @ApiPropertyOptional({ description: 'Nepali period month label', example: 'Chaitra' })
  @IsOptional()
  @IsString()
  bsPeriodMonthLabel?: string;

  @ApiPropertyOptional({ description: 'Nepali start date (BS)', example: '2082-12-01' })
  @IsOptional()
  @IsString()
  bsStartDate?: string;

  @ApiPropertyOptional({ description: 'Nepali end date (BS)', example: '2082-12-30' })
  @IsOptional()
  @IsString()
  bsEndDate?: string;

  @ApiProperty({ description: 'Gregorian period year', example: 2024 })
  @Type(() => Number)
  @IsInt()
  periodYear!: number;

  @ApiProperty({ description: 'Gregorian period month (1-12)', example: 7 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth!: number;

  @ApiPropertyOptional({ description: 'Custom period label', example: 'Shrawan 2081 Payroll' })
  @IsOptional()
  @IsString()
  periodLabel?: string;

  @ApiProperty({ description: 'Period start date', example: '2024-07-16' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'Period end date', example: '2024-08-15' })
  @IsDateString()
  endDate!: string;
}
