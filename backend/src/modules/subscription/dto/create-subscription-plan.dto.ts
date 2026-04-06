import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'Growth Plan' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'GROWTH' })
  @IsString()
  @MaxLength(30)
  code!: string;

  @ApiPropertyOptional({ example: 'For growing companies' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 29.99 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyPrice?: number;

  @ApiPropertyOptional({ example: 299.99 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  yearlyPrice?: number;

  @ApiPropertyOptional({ example: 100 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxEmployees?: number;

  @ApiPropertyOptional({ type: [String], example: ['attendance', 'leave', 'projects', 'payroll'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ example: true })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
