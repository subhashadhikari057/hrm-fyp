import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCompanyStatusDto {
  @ApiProperty({
    description: 'Company status',
    enum: ['active', 'suspended', 'archived'],
    example: 'active',
  })
  @IsEnum(['active', 'suspended', 'archived'], {
    message: 'Status must be one of: active, suspended, archived',
  })
  @IsNotEmpty()
  status: 'active' | 'suspended' | 'archived';
}

