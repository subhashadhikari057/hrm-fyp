import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AddProjectMembersDto {
  @ApiProperty({
    description: 'List of employee IDs to add to the project',
    example: ['5ea4a8cf-3d7a-4fb0-b16f-b2eff11e7d11', '6947f11a-95eb-43ff-a043-b353e8cd6e31'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  employeeIds!: string[];
}
