import { ApiProperty } from '@nestjs/swagger';

export class ImportAttendanceSummaryDto {
  @ApiProperty({ description: 'Total rows processed', example: 10 })
  total!: number;

  @ApiProperty({ description: 'Successfully imported rows', example: 8 })
  successCount!: number;

  @ApiProperty({ description: 'Failed rows', example: 2 })
  failCount!: number;

  @ApiProperty({
    description: 'Row level errors',
    example: [{ row: 3, message: 'Employee not found' }],
  })
  errors!: { row: number; message: string }[];
}


