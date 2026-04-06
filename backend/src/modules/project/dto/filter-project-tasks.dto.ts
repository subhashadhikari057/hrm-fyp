import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProjectTaskPriority, ProjectTaskStatus } from '@prisma/client';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterProjectTasksDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by task status', enum: ProjectTaskStatus })
  @IsOptional()
  @IsEnum(ProjectTaskStatus)
  status?: ProjectTaskStatus;

  @ApiPropertyOptional({ description: 'Filter by task priority', enum: ProjectTaskPriority })
  @IsOptional()
  @IsEnum(ProjectTaskPriority)
  priority?: ProjectTaskPriority;

  @ApiPropertyOptional({
    description: 'Filter by assignee employee ID',
    example: '5ea4a8cf-3d7a-4fb0-b16f-b2eff11e7d11',
  })
  @IsOptional()
  @IsUUID('4')
  assigneeEmployeeId?: string;

  @ApiPropertyOptional({ description: 'Search by title/description', example: 'design' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Due date from (inclusive)', example: '2026-03-01' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDateFrom?: Date;

  @ApiPropertyOptional({ description: 'Due date to (inclusive)', example: '2026-03-31' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDateTo?: Date;
}
