import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { UserRole } from '@prisma/client';
import { parseBoolean } from '../../../common/utils/transform.util';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password (min 8 characters)',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20, { message: 'Phone number must not exceed 20 characters' })
  phone: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: 'employee',
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @ApiProperty({
    description: 'Company ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether the user account is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @Transform(({ value }) => parseBoolean(value))
  @IsOptional()
  isActive?: boolean;
}
