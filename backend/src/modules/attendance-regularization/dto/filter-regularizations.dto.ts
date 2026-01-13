import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { RegularizationStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterRegularizationsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: RegularizationStatus })
  @IsEnum(RegularizationStatus)
  @IsOptional()
  status?: RegularizationStatus;

  @ApiPropertyOptional({ description: 'Filter by employeeId', example: 'employee-uuid' })
  @IsString()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Filter by departmentId', example: 'department-uuid' })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Start date (inclusive)', example: '2025-01-01' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateFrom?: Date;

  @ApiPropertyOptional({ description: 'End date (inclusive)', example: '2025-01-31' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateTo?: Date;
}
