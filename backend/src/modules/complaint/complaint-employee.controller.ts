import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ComplaintService } from './complaint.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { FilterComplaintsDto } from './dto/filter-complaints.dto';

@ApiTags('Complaints - Employee')
@Controller('complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class ComplaintEmployeeController {
  constructor(private readonly complaintService: ComplaintService) {}

  @Post()
  @Roles('employee', 'manager')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a complaint (self)' })
  @ApiResponse({ status: 201, description: 'Complaint submitted successfully' })
  async create(@Body() dto: CreateComplaintDto, @Request() req: any) {
    return this.complaintService.create(dto, req.user);
  }

  @Get('me')
  @Roles('employee', 'manager')
  @ApiOperation({ summary: 'List my complaints' })
  async findMy(@Query() filter: FilterComplaintsDto, @Request() req: any) {
    return this.complaintService.findMy(filter, req.user);
  }

  @Get('me/:id')
  @Roles('employee', 'manager')
  @ApiOperation({ summary: 'Get my complaint by ID' })
  async findMyById(@Param('id') id: string, @Request() req: any) {
    return this.complaintService.findMyById(id, req.user);
  }
}
