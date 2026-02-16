import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ComplaintPriority, ComplaintStatus } from '@prisma/client';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterComplaintsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: ComplaintStatus })
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @ApiPropertyOptional({ description: 'Filter by priority', enum: ComplaintPriority })
  @IsOptional()
  @IsEnum(ComplaintPriority)
  priority?: ComplaintPriority;

  @ApiPropertyOptional({ description: 'Filter by employee ID', example: 'employee-uuid' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Search by title or description', example: 'salary' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'From date (inclusive)', example: '2026-02-01' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFrom?: Date;

  @ApiPropertyOptional({ description: 'To date (inclusive)', example: '2026-02-28' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateTo?: Date;
}
