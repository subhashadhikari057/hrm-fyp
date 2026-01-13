import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReviewRegularizationDto {
  @ApiPropertyOptional({ description: 'Review note / reason', example: 'Approved after verifying logs' })
  @IsString()
  @IsOptional()
  reviewNote?: string;
}

export class RejectRegularizationDto {
  @ApiPropertyOptional({ description: 'Review note / reason', example: 'No proof provided' })
  @IsString()
  @IsOptional()
  reviewNote?: string;
}
