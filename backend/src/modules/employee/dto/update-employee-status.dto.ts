import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmployeeStatus } from '@prisma/client';

export class UpdateEmployeeStatusDto {
  @ApiProperty({
    description: 'Employee status',
    enum: EmployeeStatus,
    example: 'active',
  })
  @IsEnum(EmployeeStatus, { message: 'Status must be one of: active, on_leave, terminated' })
  @IsNotEmpty()
  status: EmployeeStatus;
}

