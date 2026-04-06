import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateProjectStatusDto {
  @ApiProperty({
    description: 'New project status',
    enum: ProjectStatus,
    example: ProjectStatus.ACTIVE,
  })
  @IsEnum(ProjectStatus)
  status!: ProjectStatus;
}
