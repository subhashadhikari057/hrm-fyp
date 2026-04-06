import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AssignCompanySubscriptionDto {
  @ApiPropertyOptional({ example: 'subscription-plan-id' })
  @IsOptional()
  @IsString()
  subscriptionPlanId?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  planExpiresAt?: Date;

  @ApiPropertyOptional({ example: 50 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  maxEmployees?: number;

  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.active })
  @IsEnum(SubscriptionStatus)
  subscriptionStatus!: SubscriptionStatus;
}
