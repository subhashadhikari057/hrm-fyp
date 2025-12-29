import { IsString, IsOptional, MaxLength, Matches, IsInt, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyDto {
  @ApiPropertyOptional({
    description: 'Name of the company',
    example: 'Acme Corporation',
    maxLength: 150,
  })
  @IsString()
  @IsOptional()
  @MaxLength(150, { message: 'Company name must not exceed 150 characters' })
  name?: string;

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
  code?: string;

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

