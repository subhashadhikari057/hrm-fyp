import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscriptionService } from './subscription.service';

@ApiTags('Subscription Plans')
@Controller('subscription-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
@Roles('super_admin')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @ApiOperation({ summary: 'Create subscription plan' })
  create(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List subscription plans' })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.subscriptionService.findAll(page ? Number(page) : undefined, limit ? Number(limit) : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription plan' })
  findOne(@Param('id') id: string) {
    return this.subscriptionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update subscription plan' })
  update(@Param('id') id: string, @Body() dto: UpdateSubscriptionPlanDto) {
    return this.subscriptionService.update(id, dto);
  }
}
