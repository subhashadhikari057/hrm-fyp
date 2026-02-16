import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { HalfDaySession } from '@prisma/client';
import { IsBoolean, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLeaveRequestDto {
  @ApiProperty({
    description: 'Leave type ID',
    example: 'leave-type-uuid',
  })
  @IsString()
  @IsNotEmpty()
  leaveTypeId!: string;

  @ApiProperty({
    description: 'Leave start date (inclusive)',
    example: '2025-02-10',
  })
  @Type(() => Date)
  @IsDate()
  startDate!: Date;

  @ApiProperty({
    description: 'Leave end date (inclusive)',
    example: '2025-02-12',
  })
  @Type(() => Date)
  @IsDate()
  endDate!: Date;

  @ApiProperty({
    description: 'Reason for leave',
    example: 'Family function',
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

  @ApiPropertyOptional({
    description: 'Whether this is a half-day leave request',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isHalfDay?: boolean;

  @ApiPropertyOptional({
    description: 'Half-day session (required when isHalfDay=true)',
    enum: HalfDaySession,
    example: HalfDaySession.FIRST_HALF,
  })
  @IsOptional()
  @IsEnum(HalfDaySession)
  halfDaySession?: HalfDaySession;
}
