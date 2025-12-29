import { IsString, IsNotEmpty, IsOptional, MaxLength, Matches, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { parseBoolean } from '../../../common/utils/transform.util';

export class CreateDesignationDto {
  @ApiProperty({
    description: 'Designation name',
    example: 'Software Engineer',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Designation name must not exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Designation code (2-20 uppercase alphanumeric characters)',
    example: 'SE',
    maxLength: 20,
    pattern: '^[A-Z0-9]{2,20}$',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Designation code must not exceed 20 characters' })
  @Matches(/^[A-Z0-9]{2,20}$/, {
    message: 'Designation code must be 2-20 uppercase alphanumeric characters',
  })
  code?: string;

  @ApiPropertyOptional({
    description: 'Designation description',
    example: 'Responsible for developing and maintaining software applications',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the designation is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @Transform(({ value }) => parseBoolean(value))
  @IsOptional()
  isActive?: boolean;
}


