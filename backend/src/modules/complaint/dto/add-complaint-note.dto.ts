import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddComplaintNoteDto {
  @ApiProperty({
    description: 'Public note for complaint',
    example: 'Please provide the transaction reference.',
  })
  @IsString()
  @IsNotEmpty()
  note!: string;
}
