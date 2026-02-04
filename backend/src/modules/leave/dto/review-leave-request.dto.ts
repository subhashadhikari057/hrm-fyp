import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReviewLeaveRequestDto {
  @ApiPropertyOptional({ description: 'Review note / reason', example: 'Approved by HR' })
  @IsString()
  @IsOptional()
  reviewNote?: string;
}

export class RejectLeaveRequestDto {
  @ApiPropertyOptional({ description: 'Review note / reason', example: 'Insufficient leave balance' })
  @IsString()
  @IsOptional()
  reviewNote?: string;
}
