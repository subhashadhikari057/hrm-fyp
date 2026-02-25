import { ApiProperty } from '@nestjs/swagger';
import { ProjectTaskStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateProjectTaskStatusDto {
  @ApiProperty({
    description: 'New task status',
    enum: ProjectTaskStatus,
    example: ProjectTaskStatus.IN_PROGRESS,
  })
  @IsEnum(ProjectTaskStatus)
  status!: ProjectTaskStatus;
}
