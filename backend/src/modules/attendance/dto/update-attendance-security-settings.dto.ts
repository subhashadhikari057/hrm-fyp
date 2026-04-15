import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateAttendanceSecuritySettingsDto {
  @ApiPropertyOptional({
    description: 'Enable attendance restriction by office IP ranges',
    example: true,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  attendanceIpRestrictionEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Allowed office public IPs or CIDR ranges',
    example: ['103.45.67.89', '103.45.67.80/29'],
    type: [String],
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attendanceAllowedIpRanges?: string[];

  @ApiPropertyOptional({
    description: 'Enable attendance restriction by office geofence',
    example: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  attendanceGeoRestrictionEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Office latitude for geofence enforcement',
    example: 27.7172,
  })
  @Type(() => Number)
  @IsLatitude()
  @IsOptional()
  officeLatitude?: number;

  @ApiPropertyOptional({
    description: 'Office longitude for geofence enforcement',
    example: 85.324,
  })
  @Type(() => Number)
  @IsLongitude()
  @IsOptional()
  officeLongitude?: number;

  @ApiPropertyOptional({
    description: 'Geofence radius in meters',
    example: 150,
    minimum: 20,
    maximum: 5000,
  })
  @Type(() => Number)
  @Min(20)
  @Max(5000)
  @IsOptional()
  officeRadiusMeters?: number;
}
