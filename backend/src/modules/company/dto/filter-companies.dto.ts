import { ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterCompaniesDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by company name or code',
    example: 'Acme',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by company status',
    enum: CompanyStatus,
    example: 'active',
  })
  @IsEnum(CompanyStatus)
  @IsOptional()
  status?: CompanyStatus;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['createdAt', 'name', 'code', 'status', 'updatedAt'],
  })
  @IsIn(['createdAt', 'name', 'code', 'status', 'updatedAt'])
  @IsOptional()
  sortBy?: 'createdAt' | 'name' | 'code' | 'status' | 'updatedAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
