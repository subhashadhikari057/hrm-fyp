import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectTaskPriority } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateProjectTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Design landing page hero section',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    description: 'Task description',
    example: 'Create final desktop and mobile variants with copy suggestions',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Task priority',
    enum: ProjectTaskPriority,
    example: ProjectTaskPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(ProjectTaskPriority)
  priority?: ProjectTaskPriority;

  @ApiPropertyOptional({
    description: 'Task due date',
    example: '2026-03-18',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({
    description: 'Assignee employee ID (must be project member)',
    example: '5ea4a8cf-3d7a-4fb0-b16f-b2eff11e7d11',
  })
  @IsOptional()
  @IsUUID('4')
  assigneeEmployeeId?: string;
}
