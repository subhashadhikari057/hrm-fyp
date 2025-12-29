import { IsOptional, IsBoolean, IsIn, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { parseBoolean } from '../../../common/utils/transform.util';

export class FilterWorkShiftsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by name, code, or description', example: 'Morning' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsBoolean()
  @Transform(({ value }) => parseBoolean(value))
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['createdAt', 'name', 'code', 'startTime', 'endTime', 'updatedAt'],
    default: 'createdAt',
  })
  @IsIn(['createdAt', 'name', 'code', 'startTime', 'endTime', 'updatedAt'])
  @IsOptional()
  sortBy?: 'createdAt' | 'name' | 'code' | 'startTime' | 'endTime' | 'updatedAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
