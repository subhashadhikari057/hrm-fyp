import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PolicyService } from './policy.service';

@ApiTags('Policy Hub - Employee')
@Controller('policy')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class PolicyEmployeeController {
  constructor(private readonly policyService: PolicyService) {}

  @Get('pending')
  @Roles('employee', 'manager')
  @ApiOperation({ summary: 'Get pending active policy to accept (if any)' })
  async pending(@Request() req: any) {
    return this.policyService.getPendingPolicy(req.user);
  }

  @Post('accept')
  @Roles('employee', 'manager')
  @ApiOperation({ summary: 'Accept current active policy version' })
  async accept(@Request() req: any) {
    return this.policyService.acceptPendingPolicy(req.user);
  }
}
