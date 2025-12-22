import { IsString, IsNotEmpty, IsOptional, MaxLength, Matches, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class CreateWorkShiftDto {
  @ApiProperty({
    description: 'Work shift name',
    example: 'Morning Shift',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Work shift name must not exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Work shift code (2-20 uppercase alphanumeric characters)',
    example: 'MS',
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
    example: 'Morning shift from 9 AM to 5 PM',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Shift start time (24-hour format)',
    example: '09:00:00',
    pattern: '^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$',
  })
  @IsString()
  @Matches(TIME_REGEX, {
    message: 'Start time must be in HH:mm or HH:mm:ss format (24-hour)',
  })
  startTime: string;

  @ApiProperty({
    description: 'Shift end time (24-hour format)',
    example: '17:00:00',
    pattern: '^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$',
  })
  @IsString()
  @Matches(TIME_REGEX, {
    message: 'End time must be in HH:mm or HH:mm:ss format (24-hour)',
  })
  endTime: string;

  @ApiPropertyOptional({
    description: 'Whether the work shift is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
