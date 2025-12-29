import { IsString, IsOptional, MaxLength, Matches, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { parseBoolean } from '../../../common/utils/transform.util';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class UpdateWorkShiftDto {
  @ApiPropertyOptional({
    description: 'Work shift name',
    example: 'Evening Shift',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Work shift name must not exceed 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Work shift code (2-20 uppercase alphanumeric characters)',
    example: 'ES',
    maxLength: 20,
    pattern: '^[A-Z0-9]{2,20}$',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Work shift code must not exceed 20 characters' })
  @Matches(/^[A-Z0-9]{2,20}$/, {
    message: 'Work shift code must be 2-20 uppercase alphanumeric characters',
  })
  code?: string;

  @ApiPropertyOptional({
    description: 'Work shift description',
    example: 'Evening shift from 1 PM to 9 PM',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Shift start time (24-hour format)',
    example: '13:00:00',
    pattern: '^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$',
  })
  @IsString()
  @IsOptional()
  @Matches(TIME_REGEX, {
    message: 'Start time must be in HH:mm or HH:mm:ss format (24-hour)',
  })
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Shift end time (24-hour format)',
    example: '21:00:00',
    pattern: '^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$',
  })
  @IsString()
  @IsOptional()
  @Matches(TIME_REGEX, {
    message: 'End time must be in HH:mm or HH:mm:ss format (24-hour)',
  })
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Whether the work shift is active',
    example: true,
  })
  @IsBoolean()
  @Transform(({ value }) => parseBoolean(value))
  @IsOptional()
  isActive?: boolean;
}
