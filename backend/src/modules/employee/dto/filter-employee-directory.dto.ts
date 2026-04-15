import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { EmploymentType } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterEmployeeDirectoryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by employee name or employee code',
    example: 'Asha',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by department ID', example: 'uuid' })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by designation ID', example: 'uuid' })
  @IsString()
  @IsOptional()
  designationId?: string;

  @ApiPropertyOptional({
    description: 'Filter by employment type',
    enum: EmploymentType,
    example: 'full_time',
  })
  @IsOptional()
  employmentType?: EmploymentType;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['firstName', 'lastName', 'employeeCode', 'joinDate'],
    example: 'firstName',
    default: 'firstName',
  })
  @IsIn(['firstName', 'lastName', 'employeeCode', 'joinDate'])
  @IsOptional()
  sortBy?: 'firstName' | 'lastName' | 'employeeCode' | 'joinDate';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'asc',
    default: 'asc',
  })
  @Type(() => String)
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
