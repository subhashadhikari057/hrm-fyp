import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { LeaveStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterLeaveRequestsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: LeaveStatus })
  @IsEnum(LeaveStatus)
  @IsOptional()
  status?: LeaveStatus;

  @ApiPropertyOptional({ description: 'Filter by employee ID', example: 'employee-uuid' })
  @IsString()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Filter by department ID', example: 'department-uuid' })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by leave type ID', example: 'leave-type-uuid' })
  @IsString()
  @IsOptional()
  leaveTypeId?: string;

  @ApiPropertyOptional({ description: 'Start date (inclusive)', example: '2025-02-01' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateFrom?: Date;

  @ApiPropertyOptional({ description: 'End date (inclusive)', example: '2025-02-28' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateTo?: Date;
}
