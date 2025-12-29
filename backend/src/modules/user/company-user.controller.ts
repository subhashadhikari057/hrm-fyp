import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { UpdateCompanyUserDto } from './dto/update-company-user.dto';
import { FilterCompanyUsersDto } from './dto/filter-company-users.dto';
import { ResetPasswordResponseDto } from './dto/reset-password-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadUtil } from '../../common/utils/file-upload.util';
import { userAvatarFileFilter, userAvatarLimits, userAvatarStorage } from '../../common/config/multer.config';
import { unlinkSync } from 'fs';

@ApiTags('Company Admin - Users')
@Controller('company/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
@Roles('company_admin')
export class CompanyUserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: userAvatarStorage,
      fileFilter: userAvatarFileFilter,
      limits: userAvatarLimits,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new user under your company (Company Admin only)' })
  @ApiBody({
    type: CreateCompanyUserDto,
    description: 'User details. For multipart/form-data, use the schema below.',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'employee@company.com' },
        password: { type: 'string', example: 'SecurePassword123!' },
        fullName: { type: 'string', example: 'John Doe' },
        phone: { type: 'string', example: '+1234567890' },
        role: { type: 'string', enum: ['hr_manager', 'manager', 'employee'] },
        avatar: { type: 'string', format: 'binary' },
        isActive: { type: 'boolean', example: true },
      },
      required: ['email', 'password'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        message: 'User created successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'employee@company.com',
          fullName: 'John Doe',
          role: 'employee',
          companyId: 'company-uuid',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or company is suspended/archived' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin role required' })
  @ApiResponse({ status: 409, description: 'Conflict - Email already exists' })
  async create(
    @Body() createUserDto: CreateCompanyUserDto,
    @Request() req: any,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    if (avatar) {
      FileUploadUtil.validateFile(avatar);
    }

    const avatarPath = avatar ? `users/${avatar.filename}` : undefined;
    const avatarFilePath = avatar ? avatar.path : undefined;

    try {
      return await this.userService.createCompanyUser(createUserDto, companyId, avatarPath);
    } catch (error) {
      if (avatarFilePath) {
        try {
          unlinkSync(avatarFilePath);
        } catch (deleteError) {
          console.error('Failed to delete uploaded avatar after error:', deleteError);
        }
      }
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all users from your company with filters and pagination (Company Admin only)' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, enum: ['hr_manager', 'manager', 'employee'] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], example: 'desc' })
  @ApiResponse({
    status: 200,
    description: 'Company users retrieved successfully',
    schema: {
      example: {
        message: 'Company users retrieved successfully',
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'employee@company.com',
            fullName: 'John Doe',
            role: 'employee',
            companyId: 'company-uuid',
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        meta: {
          total: 50,
          page: 1,
          limit: 10,
          totalPages: 5,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin role required' })
  async findAll(@Query() filterDto: FilterCompanyUsersDto, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.userService.findAllCompanyUsers(filterDto, companyId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: userAvatarStorage,
      fileFilter: userAvatarFileFilter,
      limits: userAvatarLimits,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update user in your company (Company Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({
    type: UpdateCompanyUserDto,
    description: 'User details to update. For multipart/form-data, use the schema below.',
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string', example: 'John Doe' },
        phone: { type: 'string', example: '+1234567890' },
        role: { type: 'string', enum: ['hr_manager', 'manager', 'employee'] },
        avatar: { type: 'string', format: 'binary' },
        avatarUrl: { type: 'string', example: 'https://example.com/avatar.jpg' },
        isActive: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      example: {
        message: 'User updated successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'employee@company.com',
          fullName: 'John Doe Updated',
          role: 'manager',
          isActive: true,
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or invalid role' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin role required or user does not belong to your company' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateCompanyUserDto,
    @Request() req: any,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    if (avatar) {
      FileUploadUtil.validateFile(avatar);
    }

    const avatarPath = avatar ? `users/${avatar.filename}` : undefined;
    const avatarFilePath = avatar ? avatar.path : undefined;

    try {
      return await this.userService.updateCompanyUser(id, updateUserDto, companyId, avatarPath);
    } catch (error) {
      if (avatarFilePath) {
        try {
          unlinkSync(avatarFilePath);
        } catch (deleteError) {
          console.error('Failed to delete uploaded avatar after error:', deleteError);
        }
      }
      throw error;
    }
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user password in your company (Company Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully - new password returned in response and logged to terminal',
    type: ResetPasswordResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Company Admin role required or user does not belong to your company' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new ForbiddenException('Company ID not found in token. This endpoint is only for company-level users.');
    }
    return this.userService.resetCompanyUserPassword(id, companyId);
  }
}
