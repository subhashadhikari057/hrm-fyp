import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdatePayrollSettingsDto {
  @ApiPropertyOptional({ description: 'Enable monthly TDS deduction', example: true })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  enableTaxDeduction?: boolean;

  @ApiPropertyOptional({ description: 'Enable employee SSF deduction', example: true })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  enableEmployeeSsf?: boolean;

  @ApiPropertyOptional({ description: 'Enable employer SSF contribution', example: true })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  enableEmployerSsf?: boolean;

  @ApiPropertyOptional({ description: 'Employee SSF rate as decimal', example: 0.11 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  employeeSsfRate?: number;

  @ApiPropertyOptional({ description: 'Employer SSF rate as decimal', example: 0.2 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  employerSsfRate?: number;
}
