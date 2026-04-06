import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateLeaveTypeDto {
  @ApiProperty({
    description: 'Leave type name',
    example: 'Annual Leave',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Leave type code',
    example: 'AL',
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({
    description: 'Description of leave type',
    example: 'Paid annual leave',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Allocated leave days for this leave type (per employee)',
    example: 12,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  allocatedDays!: number;

  @ApiPropertyOptional({
    description: 'Whether the leave type is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
