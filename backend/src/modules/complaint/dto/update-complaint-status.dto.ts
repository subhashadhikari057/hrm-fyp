import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateComplaintStatusDto {
  @ApiPropertyOptional({
    description: 'Optional public note while changing status',
    example: 'We are investigating this issue now.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
