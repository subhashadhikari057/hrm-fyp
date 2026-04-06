import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AddProjectTaskCommentDto } from './dto/add-project-task-comment.dto';
import { FilterProjectsDto } from './dto/filter-projects.dto';
import { FilterProjectTasksDto } from './dto/filter-project-tasks.dto';
import { UpdateProjectTaskStatusDto } from './dto/update-project-task-status.dto';
import { ProjectService } from './project.service';

@ApiTags('Projects - Employee/Manager')
@Controller('projects/me')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class ProjectEmployeeController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @Roles('employee', 'manager')
  @ApiOperation({ summary: 'List my projects' })
  async findMyProjects(@Query() filter: FilterProjectsDto, @Request() req: any) {
    return this.projectService.findMyProjects(filter, req.user);
  }

  @Get(':projectId/tasks')
  @Roles('employee', 'manager')
  @ApiOperation({ summary: 'List tasks for one of my projects' })
  async findMyProjectTasks(
    @Param('projectId') projectId: string,
    @Query() filter: FilterProjectTasksDto,
    @Request() req: any,
  ) {
    return this.projectService.findMyProjectTasks(projectId, filter, req.user);
  }

  @Get('tasks/:taskId')
  @Roles('employee', 'manager')
  @ApiOperation({ summary: 'Get a task from my projects' })
  async findMyTaskById(@Param('taskId') taskId: string, @Request() req: any) {
    return this.projectService.findMyTaskById(taskId, req.user);
  }

  @Patch('tasks/:taskId/status')
  @Roles('employee', 'manager')
  @ApiOperation({ summary: 'Update status for my assigned task' })
  async updateMyTaskStatus(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateProjectTaskStatusDto,
    @Request() req: any,
  ) {
    return this.projectService.updateMyTaskStatus(taskId, dto, req.user);
  }

  @Get('tasks/:taskId/comments')
  @Roles('employee', 'manager')
  @ApiOperation({ summary: 'List comments for a task in my projects' })
  async findMyTaskComments(
    @Param('taskId') taskId: string,
    @Query() pagination: PaginationDto,
    @Request() req: any,
  ) {
    return this.projectService.findMyTaskComments(taskId, pagination, req.user);
  }

  @Post('tasks/:taskId/comments')
  @Roles('employee', 'manager')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add comment to a task in my projects' })
  async addMyTaskComment(
    @Param('taskId') taskId: string,
    @Body() dto: AddProjectTaskCommentDto,
    @Request() req: any,
  ) {
    return this.projectService.addMyTaskComment(taskId, dto, req.user);
  }
}
