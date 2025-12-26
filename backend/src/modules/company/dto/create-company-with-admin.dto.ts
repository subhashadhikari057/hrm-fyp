import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, MaxLength, Matches, IsInt, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyWithAdminDto {
  @ApiProperty({
    description: 'Name of the company',
    example: 'Acme Corporation',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150, { message: 'Company name must not exceed 150 characters' })
  companyName: string;

  @ApiPropertyOptional({
    description: 'Unique company code (2-10 uppercase alphanumeric characters)',
    example: 'ACME001',
    pattern: '^[A-Z0-9]{2,10}$',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[A-Z0-9]{2,10}$/, {
    message: 'Company code must be 2-10 uppercase alphanumeric characters',
  })
  companyCode?: string;

  @ApiProperty({
    description: 'Email address for the company admin',
    example: 'admin@acme.com',
  })
  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @ApiProperty({
    description: 'Password for the company admin',
    example: 'admin123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  adminPassword: string;

  @ApiPropertyOptional({
    description: 'Full name of the company admin',
    example: 'Jane Smith',
  })
  @IsString()
  @IsOptional()
  adminFullName?: string;

  @ApiPropertyOptional({
    description: 'Phone number of the company admin',
    example: '+1234567890',
    maxLength: 20,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Phone number must not exceed 20 characters' })
  adminPhone?: string;

  @ApiPropertyOptional({
    description: 'Industry of the company',
    example: 'Technology',
  })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({
    description: 'Company address',
    example: '123 Main Street',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'New York',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'United States',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    description: 'Plan expiration date (ISO date string)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  planExpiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Maximum number of employees allowed',
    example: 100,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  maxEmployees?: number;
}

