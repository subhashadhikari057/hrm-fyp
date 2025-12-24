import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CheckInDto {
  @ApiPropertyOptional({
    description:
      'Employee ID to check-in for (admin/HR/manager only). If omitted, the current logged-in employee will be used.',
    example: 'employee-uuid',
  })
  @IsString()
  @IsOptional()
  employeeId?: string;
}


