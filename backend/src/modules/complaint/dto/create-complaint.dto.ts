import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComplaintPriority } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateComplaintDto {
  @ApiProperty({
    description: 'Complaint title',
    example: 'Salary delay issue',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    description: 'Complaint details',
    example: 'My salary for this month has not been credited yet.',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({
    description: 'Complaint priority',
    enum: ComplaintPriority,
    example: ComplaintPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(ComplaintPriority)
  priority?: ComplaintPriority;
}
