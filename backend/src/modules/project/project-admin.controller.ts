import {
  Body,
  Controller,
  Delete,
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
import { AddProjectMembersDto } from './dto/add-project-members.dto';
import { AddProjectTaskCommentDto } from './dto/add-project-task-comment.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateProjectTaskDto } from './dto/create-project-task.dto';
import { FilterProjectsDto } from './dto/filter-projects.dto';
import { FilterProjectTasksDto } from './dto/filter-project-tasks.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateProjectStatusDto } from './dto/update-project-status.dto';
import { UpdateProjectTaskDto } from './dto/update-project-task.dto';
import { UpdateProjectTaskStatusDto } from './dto/update-project-task-status.dto';
import { ProjectService } from './project.service';

@ApiTags('Projects - Admin/HR')
@Controller('projects/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiCookieAuth('access_token')
export class ProjectAdminController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @Roles('company_admin', 'hr_manager')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a project' })
  async create(@Body() dto: CreateProjectDto, @Request() req: any) {
    return this.projectService.createProject(dto, req.user);
  }

  @Get()
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'List projects (company scope)' })
  async findAll(@Query() filter: FilterProjectsDto, @Request() req: any) {
    return this.projectService.findAllAdmin(filter, req.user);
  }

  @Get(':projectId')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'Get project by ID (company scope)' })
  async findById(@Param('projectId') projectId: string, @Request() req: any) {
    return this.projectService.findByIdAdmin(projectId, req.user);
  }

  @Patch(':projectId')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'Update project details' })
  async update(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
    @Request() req: any,
  ) {
    return this.projectService.updateProject(projectId, dto, req.user);
  }

  @Patch(':projectId/status')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'Update project status' })
  async updateStatus(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectStatusDto,
    @Request() req: any,
  ) {
    return this.projectService.updateProjectStatus(projectId, dto, req.user);
  }

  @Delete(':projectId')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'Delete archived project' })
  async deleteProject(@Param('projectId') projectId: string, @Request() req: any) {
    return this.projectService.deleteProject(projectId, req.user);
  }

  @Post(':projectId/members')
  @Roles('company_admin', 'hr_manager')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add project members' })
  async addMembers(
    @Param('projectId') projectId: string,
    @Body() dto: AddProjectMembersDto,
    @Request() req: any,
  ) {
    return this.projectService.addMembers(projectId, dto, req.user);
  }

  @Delete(':projectId/members/:employeeId')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'Remove project member' })
  async removeMember(
    @Param('projectId') projectId: string,
    @Param('employeeId') employeeId: string,
    @Request() req: any,
  ) {
    return this.projectService.removeMember(projectId, employeeId, req.user);
  }

  @Post(':projectId/tasks')
  @Roles('company_admin', 'hr_manager')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create task in project' })
  async createTask(
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectTaskDto,
    @Request() req: any,
  ) {
    return this.projectService.createTask(projectId, dto, req.user);
  }

  @Get(':projectId/tasks')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'List tasks for a project' })
  async findTasks(
    @Param('projectId') projectId: string,
    @Query() filter: FilterProjectTasksDto,
    @Request() req: any,
  ) {
    return this.projectService.findTasksAdmin(projectId, filter, req.user);
  }

  @Get('tasks/:taskId')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'Get task by ID (company scope)' })
  async findTaskById(@Param('taskId') taskId: string, @Request() req: any) {
    return this.projectService.findTaskByIdAdmin(taskId, req.user);
  }

  @Patch('tasks/:taskId')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'Update task details' })
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateProjectTaskDto,
    @Request() req: any,
  ) {
    return this.projectService.updateTask(taskId, dto, req.user);
  }

  @Patch('tasks/:taskId/status')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'Update task status' })
  async updateTaskStatus(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateProjectTaskStatusDto,
    @Request() req: any,
  ) {
    return this.projectService.updateTaskStatusAdmin(taskId, dto, req.user);
  }

  @Get('tasks/:taskId/comments')
  @Roles('company_admin', 'hr_manager')
  @ApiOperation({ summary: 'List task comments' })
  async findTaskComments(
    @Param('taskId') taskId: string,
    @Query() pagination: PaginationDto,
    @Request() req: any,
  ) {
    return this.projectService.findTaskCommentsAdmin(taskId, pagination, req.user);
  }

  @Post('tasks/:taskId/comments')
  @Roles('company_admin', 'hr_manager')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add comment to task' })
  async addTaskComment(
    @Param('taskId') taskId: string,
    @Body() dto: AddProjectTaskCommentDto,
    @Request() req: any,
  ) {
    return this.projectService.addTaskCommentAdmin(taskId, dto, req.user);
  }
}
