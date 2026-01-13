import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { parseBoolean } from '../../../common/utils/transform.util';

export class FilterMyNoticesDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by title or body', example: 'Holiday' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Only return unread notices', example: true })
  @IsBoolean()
  @Transform(({ value }) => parseBoolean(value))
  @IsOptional()
  unreadOnly?: boolean;
}
