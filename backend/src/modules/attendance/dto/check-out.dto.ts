import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';

export class CheckOutDto {
  @ApiPropertyOptional({
    description:
      'Employee ID to check-out for (admin/HR/manager only). If omitted, the current logged-in employee will be used.',
    example: 'employee-uuid',
  })
  @IsString()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'Current latitude of the user (used when geo restriction is enabled)',
    example: 27.7172,
  })
  @Type(() => Number)
  @IsLatitude()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Current longitude of the user (used when geo restriction is enabled)',
    example: 85.324,
  })
  @Type(() => Number)
  @IsLongitude()
  @IsOptional()
  longitude?: number;
}


