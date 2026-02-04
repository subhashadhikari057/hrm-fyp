import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

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

  @ApiPropertyOptional({
    description: 'Whether the leave type is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
