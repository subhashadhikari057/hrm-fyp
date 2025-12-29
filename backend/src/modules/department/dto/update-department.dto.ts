import { IsString, IsOptional, MaxLength, Matches, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { parseBoolean } from '../../../common/utils/transform.util';

export class UpdateDepartmentDto {
  @ApiPropertyOptional({
    description: 'Department name',
    example: 'Human Resources',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Department name must not exceed 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Department code (2-20 uppercase alphanumeric characters)',
    example: 'HR',
    maxLength: 20,
    pattern: '^[A-Z0-9]{2,20}$',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Department code must not exceed 20 characters' })
  @Matches(/^[A-Z0-9]{2,20}$/, {
    message: 'Department code must be 2-20 uppercase alphanumeric characters',
  })
  code?: string;

  @ApiPropertyOptional({
    description: 'Department description',
    example: 'Handles recruitment, employee relations, and HR policies',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the department is active',
    example: true,
  })
  @IsBoolean()
  @Transform(({ value }) => parseBoolean(value))
  @IsOptional()
  isActive?: boolean;
}
