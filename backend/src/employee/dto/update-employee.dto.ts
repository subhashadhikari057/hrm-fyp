import { IsString, IsOptional, MaxLength, IsEnum, IsDate, IsNumber, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType, Gender } from '@prisma/client';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ description: 'First name', example: 'John', maxLength: 80 })
  @IsString()
  @IsOptional()
  @MaxLength(80, { message: 'First name must not exceed 80 characters' })
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe', maxLength: 80 })
  @IsString()
  @IsOptional()
  @MaxLength(80, { message: 'Last name must not exceed 80 characters' })
  lastName?: string;

  @ApiPropertyOptional({ description: 'Middle name', example: 'Michael', maxLength: 80 })
  @IsString()
  @IsOptional()
  @MaxLength(80, { message: 'Middle name must not exceed 80 characters' })
  middleName?: string;

  @ApiPropertyOptional({ description: 'Department ID', example: 'uuid' })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Designation ID', example: 'uuid' })
  @IsString()
  @IsOptional()
  designationId?: string;

  @ApiPropertyOptional({ description: 'Employment type', enum: EmploymentType, example: 'full_time' })
  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ description: 'Gender', enum: Gender, example: 'male' })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Date of birth (ISO date string)', example: '1990-01-15T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateOfBirth?: Date;

  @ApiPropertyOptional({ description: 'Join date (ISO date string)', example: '2024-01-01T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  joinDate?: Date;

  @ApiPropertyOptional({ description: 'Probation end date (ISO date string)', example: '2024-04-01T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  probationEnd?: Date;

  @ApiPropertyOptional({ description: 'Location ID (for future CompanyLocation relation)', example: 'uuid' })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Work email', example: 'john.doe@company.com' })
  @IsEmail()
  @IsOptional()
  workEmail?: string;

  @ApiPropertyOptional({ description: 'Personal email', example: 'john.doe.personal@gmail.com' })
  @IsEmail()
  @IsOptional()
  personalEmail?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1234567890', maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Phone must not exceed 20 characters' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Address', example: '123 Main St, City, Country' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Emergency contact name', example: 'Jane Doe' })
  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @ApiPropertyOptional({ description: 'Emergency contact phone', example: '+1234567891', maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Emergency contact phone must not exceed 20 characters' })
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ description: 'Base salary', example: 50000.00, type: Number })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  baseSalary?: number;
}

