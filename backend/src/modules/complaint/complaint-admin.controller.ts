import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ComplaintService } from './complaint.service';
import { FilterComplaintsDto } from './dto/filter-complaints.dto';
import { UpdateComplaintStatusDto } from './dto/update-complaint-status.dto';
import { AddComplaintNoteDto } from './dto/add-complaint-note.dto';

@ApiTags('Complaints - Admin/HR')
@Controller('complaints/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class ComplaintAdminController {
  constructor(private readonly complaintService: ComplaintService) {}

  @Get()
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'List complaints (company scope)' })
  async findAll(@Query() filter: FilterComplaintsDto, @Request() req: any) {
    return this.complaintService.findAllAdmin(filter, req.user);
  }

  @Get(':id')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'Get complaint by ID (company scope)' })
  async findById(@Param('id') id: string, @Request() req: any) {
    return this.complaintService.findByIdAdmin(id, req.user);
  }

  @Patch(':id/in-progress')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'Move complaint to in-progress' })
  async markInProgress(
    @Param('id') id: string,
    @Body() dto: UpdateComplaintStatusDto,
    @Request() req: any,
  ) {
    return this.complaintService.markInProgress(id, dto, req.user);
  }

  @Patch(':id/resolve')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'Resolve complaint and auto-close it' })
  async resolve(
    @Param('id') id: string,
    @Body() dto: UpdateComplaintStatusDto,
    @Request() req: any,
  ) {
    return this.complaintService.resolve(id, dto, req.user);
  }

  @Post(':id/notes')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'Add public note to complaint' })
  async addNote(
    @Param('id') id: string,
    @Body() dto: AddComplaintNoteDto,
    @Request() req: any,
  ) {
    return this.complaintService.addNote(id, dto, req.user);
  }
}
