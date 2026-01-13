import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RegularizationRequestType } from '@prisma/client';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class CreateRegularizationDto {
  @ApiProperty({
    description: 'Target date for regularization',
    example: '2025-01-05',
  })
  @Type(() => Date)
  @IsDate()
  date!: Date;

  @ApiProperty({
    description: 'Request type',
    enum: RegularizationRequestType,
    example: 'MISSED_CHECKIN',
  })
  @IsEnum(RegularizationRequestType)
  requestType!: RegularizationRequestType;

  @ApiPropertyOptional({
    description: 'Proposed check-in time (HH:mm or HH:mm:ss)',
    example: '09:15:00',
    pattern: '^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$',
  })
  @IsOptional()
  @IsString()
  requestedCheckInTime?: string;

  @ApiPropertyOptional({
    description: 'Proposed check-out time (HH:mm or HH:mm:ss)',
    example: '18:05:00',
    pattern: '^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$',
  })
  @IsOptional()
  @IsString()
  requestedCheckOutTime?: string;

  @ApiProperty({
    description: 'Reason for correction',
    example: 'Forgot to punch in due to network issue',
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({
    description: 'Employee ID (for admins creating on behalf)',
    example: 'employee-uuid',
  })
  @IsOptional()
  @IsString()
  employeeId?: string;

  validateTimes() {
    if (this.requestedCheckInTime && !TIME_REGEX.test(this.requestedCheckInTime)) {
      throw new Error('Invalid requestedCheckInTime format');
    }
    if (this.requestedCheckOutTime && !TIME_REGEX.test(this.requestedCheckOutTime)) {
      throw new Error('Invalid requestedCheckOutTime format');
    }
  }
}
