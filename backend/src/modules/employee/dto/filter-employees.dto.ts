import { IsOptional, IsString, IsEnum, IsInt, Min, Max, IsDate, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeStatus, EmploymentType } from '@prisma/client';

export class FilterEmployeesDto {
  @ApiPropertyOptional({ description: 'Search by name or employee code', example: 'John' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: EmployeeStatus, example: 'active' })
  @IsEnum(EmployeeStatus)
  @IsOptional()
  status?: EmployeeStatus;

  @ApiPropertyOptional({ description: 'Filter by department ID', example: 'uuid' })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by designation ID', example: 'uuid' })
  @IsString()
  @IsOptional()
  designationId?: string;

  @ApiPropertyOptional({ description: 'Filter by work shift ID', example: 'uuid' })
  @IsString()
  @IsOptional()
  workShiftId?: string;

  @ApiPropertyOptional({ description: 'Filter by employment type', enum: EmploymentType, example: 'full_time' })
  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ description: 'Filter by join date from (ISO date string)', example: '2024-01-01T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  joinDateFrom?: Date;

  @ApiPropertyOptional({ description: 'Filter by join date to (ISO date string)', example: '2024-12-31T23:59:59.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  joinDateTo?: Date;

  @ApiPropertyOptional({ description: 'Filter by date of birth from (ISO date string)', example: '1990-01-01T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateOfBirthFrom?: Date;

  @ApiPropertyOptional({ description: 'Filter by date of birth to (ISO date string)', example: '2000-12-31T23:59:59.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateOfBirthTo?: Date;

  @ApiPropertyOptional({ description: 'Minimum base salary', example: 30000, type: Number })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  minSalary?: number;

  @ApiPropertyOptional({ description: 'Maximum base salary', example: 100000, type: Number })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  maxSalary?: number;

  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['createdAt', 'firstName', 'lastName', 'employeeCode', 'joinDate'],
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'createdAt' | 'firstName' | 'lastName' | 'employeeCode' | 'joinDate' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
