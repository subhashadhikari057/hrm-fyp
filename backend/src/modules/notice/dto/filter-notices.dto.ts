import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { NoticePriority, NoticeStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { parseBoolean, parseDate } from '../../../common/utils/transform.util';

export class FilterNoticesDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by title or body', example: 'Holiday' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: NoticeStatus })
  @IsEnum(NoticeStatus)
  @IsOptional()
  status?: NoticeStatus;

  @ApiPropertyOptional({ description: 'Filter by priority', enum: NoticePriority })
  @IsEnum(NoticePriority)
  @IsOptional()
  priority?: NoticePriority;

  @ApiPropertyOptional({ description: 'Filter by company-wide flag', example: true })
  @IsBoolean()
  @Transform(({ value }) => parseBoolean(value))
  @IsOptional()
  isCompanyWide?: boolean;

  @ApiPropertyOptional({ description: 'Filter by creator user ID', example: 'user-uuid' })
  @IsString()
  @IsOptional()
  createdById?: string;

  @ApiPropertyOptional({ description: 'Publish from timestamp', example: '2025-01-01T00:00:00.000Z' })
  @Transform(({ value }) => parseDate(value))
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  publishFrom?: Date;

  @ApiPropertyOptional({ description: 'Publish to timestamp', example: '2025-01-31T23:59:59.000Z' })
  @Transform(({ value }) => parseDate(value))
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  publishTo?: Date;
}
