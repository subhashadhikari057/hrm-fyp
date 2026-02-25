import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterProjectsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by project status', enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({
    description: 'Search by project name or description',
    example: 'revamp',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
