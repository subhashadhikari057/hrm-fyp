import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddProjectTaskCommentDto {
  @ApiProperty({
    description: 'Task comment',
    example: 'Design is ready for review. Please check the latest files.',
  })
  @IsString()
  @IsNotEmpty()
  comment!: string;
}
