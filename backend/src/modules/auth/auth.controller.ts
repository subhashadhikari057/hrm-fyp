import { Controller, Post, Body, HttpCode, HttpStatus, Get, Res, UseGuards, Request, Patch, Req, UnauthorizedException, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateSuperAdminDto } from './dto/create-superadmin.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '30d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';
const COOKIE_SECURE = process.env.AUTH_COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
const COOKIE_SAMESITE = (process.env.AUTH_COOKIE_SAMESITE || 'lax') as 'lax' | 'strict' | 'none';
const COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN;

function parseExpiryToMs(value: string) {
  const normalized = value.trim();
  const match = normalized.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) {
    return 30 * 24 * 60 * 60 * 1000;
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 's':
      return amount * 1000;
    case 'm':
      return amount * 60 * 1000;
    case 'h':
      return amount * 60 * 60 * 1000;
    case 'd':
      return amount * 24 * 60 * 60 * 1000;
    default:
      return 30 * 24 * 60 * 60 * 1000;
  }
}

function buildCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    maxAge,
    path: '/',
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  };
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Get('super-admin')
  @ApiOperation({ summary: 'Get super admin creation form (HTML page)' })
  @ApiResponse({ status: 200, description: 'Returns HTML form for creating super admin' })
  getSuperAdminForm(@Res() res: Response) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Super Admin - HRM System</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 100%;
            padding: 40px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #333;
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #666;
            font-size: 14px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            color: #333;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .required {
            color: #e74c3c;
        }
        
        input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 14px;
            transition: all 0.3s ease;
            outline: none;
        }
        
        input:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .help-text {
            font-size: 12px;
            color: #999;
            margin-top: 5px;
        }
        
        .submit-btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            margin-top: 10px;
        }
        
        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .submit-btn:active {
            transform: translateY(0);
        }
        
        .submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .message {
            padding: 12px 16px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-size: 14px;
            display: none;
        }
        
        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            display: block;
        }
        
        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            display: block;
        }
        
        .optional {
            color: #999;
            font-weight: normal;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Create Super Admin</h1>
            <p>Set up your HRM system administrator</p>
        </div>
        
        <div id="message" class="message"></div>
        
        <form id="superAdminForm">
            <div class="form-group">
                <label for="email">Email Address <span class="required">*</span></label>
                <input type="email" id="email" name="email" required placeholder="admin@example.com">
                <div class="help-text">This will be used for login</div>
            </div>
            
            <div class="form-group">
                <label for="password">Password <span class="required">*</span></label>
                <input type="password" id="password" name="password" required placeholder="Minimum 8 characters" minlength="8">
                <div class="help-text">Must be at least 8 characters long</div>
            </div>
            
            <div class="form-group">
                <label for="fullName">Full Name <span class="optional">(Optional)</span></label>
                <input type="text" id="fullName" name="fullName" placeholder="John Doe">
            </div>
            
            <div class="form-group">
                <label for="phone">Phone Number <span class="optional">(Optional)</span></label>
                <input type="tel" id="phone" name="phone" placeholder="+1234567890">
            </div>
            
            <button type="submit" class="submit-btn" id="submitBtn">Create Super Admin</button>
        </form>
    </div>
    
    <script>
        const form = document.getElementById('superAdminForm');
        const messageDiv = document.getElementById('message');
        const submitBtn = document.getElementById('submitBtn');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';
            
            // Hide previous messages
            messageDiv.className = 'message';
            messageDiv.style.display = 'none';
            
            // Get form data
            const formData = new FormData(form);
            const data = {
                email: formData.get('email'),
                password: formData.get('password'),
                fullName: formData.get('fullName') || undefined,
                phone: formData.get('phone') || undefined,
            };
            
            // Remove undefined fields
            Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
            
            try {
                const response = await fetch('/auth/super-admin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    messageDiv.className = 'message success';
                    messageDiv.textContent = '✅ ' + result.message + ' User ID: ' + result.user.id;
                    messageDiv.style.display = 'block';
                    form.reset();
                } else {
                    messageDiv.className = 'message error';
                    messageDiv.textContent = '❌ ' + (result.message || 'An error occurred');
                    messageDiv.style.display = 'block';
                }
            } catch (error) {
                messageDiv.className = 'message error';
                messageDiv.textContent = '❌ Network error. Please check if the server is running.';
                messageDiv.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Super Admin';
            }
        });
    </script>
</body>
</html>
    `;
    res.send(html);
  }

  @Post('super-admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new super admin user' })
  @ApiBody({ type: CreateSuperAdminDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Super admin created successfully',
    schema: {
      example: {
        message: 'Super admin created successfully',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'admin@example.com',
          fullName: 'John Doe',
          role: 'super_admin'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async createSuperAdmin(@Body() createSuperAdminDto: CreateSuperAdminDto) {
    return this.authService.createSuperAdmin(createSuperAdminDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user and set JWT token in cookie' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful - JWT token set in HttpOnly cookie',
    schema: {
      example: {
        message: 'Login successful',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'admin@example.com',
          fullName: 'John Doe',
          role: 'super_admin'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);

    const accessMaxAge = parseExpiryToMs(ACCESS_TOKEN_EXPIRES_IN);
    const refreshMaxAge = parseExpiryToMs(REFRESH_TOKEN_EXPIRES_IN);

    // Set HttpOnly cookies
    res.cookie('access_token', result.access_token, buildCookieOptions(accessMaxAge));
    res.cookie('refresh_token', result.refresh_token, buildCookieOptions(refreshMaxAge));

    // Return user data without token (token is in cookie)
    return {
      message: result.message,
      user: result.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user and clear JWT token cookie' })
  @ApiCookieAuth('access_token')
  @ApiCookieAuth('refresh_token')
  @ApiResponse({ 
    status: 200, 
    description: 'Logout successful',
    schema: {
      example: {
        message: 'Logged out successfully'
      }
    }
  })
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req?.cookies?.['refresh_token'];

    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }

    // Clear the cookie
    res.clearCookie('access_token', buildCookieOptions(0));
    res.clearCookie('refresh_token', buildCookieOptions(0));

    return {
      message: 'Logged out successfully',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiCookieAuth('refresh_token')
  @ApiResponse({
    status: 200,
    description: 'Access token refreshed',
    schema: {
      example: {
        message: 'Access token refreshed',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'admin@example.com',
          fullName: 'John Doe',
          role: 'super_admin',
        },
      },
    },
  })
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req?.cookies?.['refresh_token'];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    this.logger.log('Refresh token request received');

    const result = await this.authService.refreshAccessToken(refreshToken);
    const accessMaxAge = parseExpiryToMs(ACCESS_TOKEN_EXPIRES_IN);
    res.cookie('access_token', result.access_token, buildCookieOptions(accessMaxAge));

    return {
      message: 'Access token refreshed',
      user: result.user,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user information' })
  @ApiBearerAuth('JWT-auth')
  @ApiCookieAuth('access_token')
  @ApiResponse({ 
    status: 200, 
    description: 'Returns current user information',
    schema: {
      example: {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'admin@example.com',
          fullName: 'John Doe',
          role: 'super_admin'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  async getMe(@Request() req: any) {
    // User is attached to request by JWT strategy
    const user = await this.authService.getUserById(req.user.id);

    return {
      user,
    };
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiBearerAuth('JWT-auth')
  @ApiCookieAuth('access_token')
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Password changed successfully',
    schema: {
      example: {
        message: 'Password changed successfully'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - current password is incorrect' })
  async changePassword(@Request() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }
}
