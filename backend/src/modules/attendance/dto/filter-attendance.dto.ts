import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { AttendanceStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterAttendanceDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by employee ID',
    example: 'employee-uuid',
  })
  @IsString()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by department ID',
    example: 'department-uuid',
  })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by designation ID',
    example: 'designation-uuid',
  })
  @IsString()
  @IsOptional()
  designationId?: string;

  @ApiPropertyOptional({
    description: 'Filter by work shift ID',
    example: 'workshift-uuid',
  })
  @IsString()
  @IsOptional()
  shiftId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: AttendanceStatus,
    example: 'PRESENT',
  })
  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;

  @ApiPropertyOptional({
    description: 'Filter by date from (ISO date string)',
    example: '2025-01-01T00:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateFrom?: Date;

  @ApiPropertyOptional({
    description: 'Filter by date to (ISO date string)',
    example: '2025-01-31T23:59:59.000Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateTo?: Date;

}


