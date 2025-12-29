import { IsEmail, IsString, IsOptional, IsEnum, MaxLength, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { UserRole } from '@prisma/client';
import { parseBoolean } from '../../../common/utils/transform.util';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+1234567890',
    maxLength: 20,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Phone number must not exceed 20 characters' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    example: 'employee',
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

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
  })
  @IsBoolean()
  @Transform(({ value }) => parseBoolean(value))
  @IsOptional()
  isActive?: boolean;
}
