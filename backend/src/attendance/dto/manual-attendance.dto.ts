import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class ManualAttendanceDto {
  @ApiProperty({
    description: 'Employee ID',
    example: 'employee-uuid',
  })
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty({
    description: 'Attendance date (start of the day will be used)',
    example: '2025-01-10T00:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  date!: Date;

  @ApiPropertyOptional({
    description: 'Work shift ID (optional)',
    example: 'workshift-uuid',
  })
  @IsString()
  @IsOptional()
  shiftId?: string;

  @ApiPropertyOptional({
    description: 'Check-in time',
    example: '2025-01-10T09:05:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  checkInTime?: Date;

  @ApiPropertyOptional({
    description: 'Check-out time',
    example: '2025-01-10T18:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  checkOutTime?: Date;

  @ApiPropertyOptional({
    description: 'Attendance status override (if omitted, it will be calculated)',
    enum: AttendanceStatus,
    example: 'PRESENT',
  })
  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;

  @ApiPropertyOptional({
    description: 'Notes/reason',
    example: 'Adjusted due to official visit',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateAttendanceDto {
  @ApiPropertyOptional({
    description: 'Check-in time',
    example: '2025-01-10T09:05:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  checkInTime?: Date;

  @ApiPropertyOptional({
    description: 'Check-out time',
    example: '2025-01-10T18:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  checkOutTime?: Date;

  @ApiPropertyOptional({
    description: 'Attendance status override',
    enum: AttendanceStatus,
    example: 'HALF_DAY',
  })
  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;

  @ApiPropertyOptional({
    description: 'Notes/reason',
    example: 'Half day approved by HR',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}



