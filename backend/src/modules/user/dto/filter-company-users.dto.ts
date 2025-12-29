import { IsOptional, IsEnum, IsBoolean, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { parseBoolean } from '../../../common/utils/transform.util';

export class FilterCompanyUsersDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by name, email, or phone',
    example: 'john',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by user role',
    enum: ['hr_manager', 'manager', 'employee'],
    example: 'employee',
  })
  @IsEnum(['hr_manager', 'manager', 'employee'])
  @IsOptional()
  role?: 'hr_manager' | 'manager' | 'employee';

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsBoolean()
  @Transform(({ value }) => parseBoolean(value))
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['createdAt', 'email', 'fullName', 'lastLoginAt', 'updatedAt'],
    default: 'createdAt',
  })
  @IsIn(['createdAt', 'email', 'fullName', 'lastLoginAt', 'updatedAt'])
  @IsOptional()
  sortBy?: 'createdAt' | 'email' | 'fullName' | 'lastLoginAt' | 'updatedAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
