import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectTaskPriority } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateProjectTaskDto {
  @ApiPropertyOptional({
    description: 'Task title',
    example: 'Design landing page hero section (updated)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Task description',
    example: 'Updated details for final iteration',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Task priority',
    enum: ProjectTaskPriority,
    example: ProjectTaskPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(ProjectTaskPriority)
  priority?: ProjectTaskPriority;

  @ApiPropertyOptional({
    description: 'Task due date',
    example: '2026-03-20',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({
    description: 'Assignee employee ID (must be project member)',
    example: '6947f11a-95eb-43ff-a043-b353e8cd6e31',
  })
  @IsOptional()
  @IsUUID('4')
  assigneeEmployeeId?: string;
}
