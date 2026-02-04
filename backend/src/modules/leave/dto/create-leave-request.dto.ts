import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}
