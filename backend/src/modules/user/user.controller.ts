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
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { ResetPasswordResponseDto } from './dto/reset-password-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileUploadUtil } from '../../common/utils/file-upload.util';
import { userAvatarFileFilter, userAvatarLimits, userAvatarStorage } from '../../common/config/multer.config';
import { unlinkSync } from 'fs';

@ApiTags('Super Admin - Users')
@Controller('superadmin-users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
@Roles('super_admin')
export class UserController {
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
  @ApiOperation({ summary: 'Create a new user (Super Admin only)' })
  @ApiBody({
    type: CreateUserDto,
    description: 'User details. For multipart/form-data, use the schema below.',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'SecurePassword123!' },
        fullName: { type: 'string', example: 'John Doe' },
        phone: { type: 'string', example: '+1234567890' },
        role: {
          type: 'string',
          enum: ['super_admin', 'company_admin', 'hr_manager', 'manager', 'employee'],
        },
        companyId: { type: 'string', example: 'company-uuid' },
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'User avatar image file (optional)',
        },
        isActive: { type: 'boolean', example: true },
      },
      required: ['email', 'password', 'fullName', 'phone', 'role', 'companyId'],
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
          email: 'user@example.com',
          fullName: 'John Doe',
          role: 'employee',
          companyId: 'company-uuid',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin role required' })
  @ApiResponse({ status: 409, description: 'Conflict - Email already exists' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    if (avatar) {
      FileUploadUtil.validateFile(avatar);
    }

    const avatarPath = avatar ? `users/${avatar.filename}` : undefined;
    const avatarFilePath = avatar ? avatar.path : undefined;

    try {
      return await this.userService.create(createUserDto, avatarPath);
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
  @ApiOperation({ summary: 'Get all users with filters and pagination (Super Admin only)' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, enum: ['super_admin', 'company_admin', 'hr_manager', 'manager', 'employee'] })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], example: 'desc' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      example: {
        message: 'Users retrieved successfully',
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'user@example.com',
            fullName: 'John Doe',
            role: 'employee',
            companyId: 'company-uuid',
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        meta: {
          total: 100,
          page: 1,
          limit: 10,
          totalPages: 10,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin role required' })
  async findAll(@Query() filterDto: FilterUsersDto) {
    return this.userService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    schema: {
      example: {
        message: 'User retrieved successfully',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          fullName: 'John Doe',
          role: 'employee',
          companyId: 'company-uuid',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
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
  @ApiOperation({ summary: 'Update user (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({
    type: UpdateUserDto,
    description: 'User details to update. For multipart/form-data, use the schema below.',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        fullName: { type: 'string', example: 'John Doe' },
        phone: { type: 'string', example: '+1234567890' },
        role: {
          type: 'string',
          enum: ['super_admin', 'company_admin', 'hr_manager', 'manager', 'employee'],
        },
        companyId: { type: 'string', example: 'company-uuid' },
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'User avatar image file (optional)',
        },
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
          email: 'user@example.com',
          fullName: 'John Doe Updated',
          role: 'manager',
          isActive: true,
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin role required or last super admin protection' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Email already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    if (avatar) {
      FileUploadUtil.validateFile(avatar);
    }

    const avatarPath = avatar ? `users/${avatar.filename}` : undefined;
    const avatarFilePath = avatar ? avatar.path : undefined;

    try {
      return await this.userService.update(id, updateUserDto, avatarPath);
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
  @ApiOperation({ summary: 'Reset user password (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully - new password returned in response and logged to terminal',
    type: ResetPasswordResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin role required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(@Param('id') id: string) {
    return this.userService.resetPassword(id);
  }
}
