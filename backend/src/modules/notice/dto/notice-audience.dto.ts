import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { NoticeAudienceType, UserRole } from '@prisma/client';

export class NoticeAudienceDto {
  @ApiProperty({ description: 'Audience type', enum: NoticeAudienceType })
  @IsEnum(NoticeAudienceType)
  type: NoticeAudienceType;

  @ApiPropertyOptional({ description: 'Department ID for DEPARTMENT audience' })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Designation ID for DESIGNATION audience' })
  @IsString()
  @IsOptional()
  designationId?: string;

  @ApiPropertyOptional({ description: 'Employee ID for EMPLOYEE audience' })
  @IsString()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Role for ROLE audience', enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Work shift ID for WORK_SHIFT audience' })
  @IsString()
  @IsOptional()
  workShiftId?: string;
}
