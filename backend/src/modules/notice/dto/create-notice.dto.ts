import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { NoticePriority, NoticeStatus } from '@prisma/client';
import { parseBoolean, parseDate } from '../../../common/utils/transform.util';
import { NoticeAudienceDto } from './notice-audience.dto';

export class CreateNoticeDto {
  @ApiProperty({ description: 'Notice title', maxLength: 200, example: 'Holiday Announcement' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Notice body content' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ description: 'Notice priority', enum: NoticePriority, default: 'NORMAL' })
  @IsEnum(NoticePriority)
  @IsOptional()
  priority?: NoticePriority;

  @ApiPropertyOptional({ description: 'Notice status', enum: NoticeStatus, default: 'DRAFT' })
  @IsEnum(NoticeStatus)
  @IsOptional()
  status?: NoticeStatus;

  @ApiPropertyOptional({ description: 'Publish at timestamp', example: '2025-01-01T00:00:00.000Z' })
  @Transform(({ value }) => parseDate(value))
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  publishAt?: Date;

  @ApiPropertyOptional({ description: 'Expires at timestamp', example: '2025-01-31T23:59:59.000Z' })
  @Transform(({ value }) => parseDate(value))
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'Whether the notice is company-wide', default: true })
  @IsBoolean()
  @Transform(({ value }) => parseBoolean(value))
  @IsOptional()
  isCompanyWide?: boolean;

  @ApiPropertyOptional({ description: 'Audience targets (ignored for company-wide notices)', type: [NoticeAudienceDto] })
  @Transform(({ value }) => {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) {
      return parsed;
    }
    return parsed.map((item) => Object.assign(new NoticeAudienceDto(), item));
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoticeAudienceDto)
  @IsOptional()
  audiences?: NoticeAudienceDto[];
}
