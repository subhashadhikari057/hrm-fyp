import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdatePolicyDto {
  @ApiPropertyOptional({
    description: 'Optional updated policy title',
    example: 'Company Work Policy',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiProperty({
    description: 'New policy content for next version',
    example: 'Updated policy content...',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({
    description: 'Policy version (semantic dotted format)',
    example: '1.0.1',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d+)*$/, {
    message: 'version must be a dotted numeric format (e.g. 1.0.1)',
  })
  version!: string;

  @ApiPropertyOptional({
    description: 'Policy effective from date',
    example: '2026-02-17T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveFrom?: Date;
}
