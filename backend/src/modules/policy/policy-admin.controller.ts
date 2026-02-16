import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PolicyService } from './policy.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';

@ApiTags('Policy Hub - Admin')
@Controller('policy')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class PolicyAdminController {
  constructor(private readonly policyService: PolicyService) {}

  @Get()
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'List policies with versions (company scope)' })
  async list(@Request() req: any) {
    return this.policyService.listPolicies(req.user);
  }

  @Get('current')
  @Roles('company_admin', 'hr_manager', 'employee', 'manager')
  @ApiOperation({ summary: 'Get current active policy' })
  async current(@Request() req: any) {
    return this.policyService.getCurrentPolicy(req.user);
  }

  @Post()
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'Create new active policy with version 1' })
  async create(@Body() dto: CreatePolicyDto, @Request() req: any) {
    return this.policyService.createPolicy(dto, req.user);
  }

  @Patch(':id')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'Create new policy version and make it active' })
  async update(@Param('id') id: string, @Body() dto: UpdatePolicyDto, @Request() req: any) {
    return this.policyService.updatePolicy(id, dto, req.user);
  }
}
