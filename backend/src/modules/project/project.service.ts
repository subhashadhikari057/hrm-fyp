import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectStatus, ProjectTaskStatus, UserRole } from '@prisma/client';
import { buildPaginationMeta, getPagination } from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
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

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  private async attachTaskSummaries<T extends { id: string }>(projects: T[]) {
    if (projects.length === 0) {
      return projects.map((project) => ({
        ...project,
        taskSummary: {
          TODO: 0,
          IN_PROGRESS: 0,
          REVIEW: 0,
          DONE: 0,
        } satisfies Record<ProjectTaskStatus, number>,
      }));
    }

    const counts = await this.prisma.projectTask.groupBy({
      by: ['projectId', 'status'],
      where: {
        projectId: { in: projects.map((project) => project.id) },
      },
      _count: {
        status: true,
      },
    });

    const summaryMap = new Map<string, Record<ProjectTaskStatus, number>>();

    for (const project of projects) {
      summaryMap.set(project.id, {
        TODO: 0,
        IN_PROGRESS: 0,
        REVIEW: 0,
        DONE: 0,
      });
    }

    for (const row of counts) {
      const summary = summaryMap.get(row.projectId);
      if (summary) {
        summary[row.status] = row._count.status;
      }
    }

    return projects.map((project) => ({
      ...project,
      taskSummary: summaryMap.get(project.id) || {
        TODO: 0,
        IN_PROGRESS: 0,
        REVIEW: 0,
        DONE: 0,
      },
    }));
  }

  private ensureAdminOrHr(currentUser: any) {
    const role: UserRole = currentUser.role;
    if (!(role === 'company_admin' || role === 'hr_manager')) {
      throw new ForbiddenException('Only Company Admin or HR Manager can perform this action');
    }
  }

  private ensureCompanyId(currentUser: any): string {
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company ID not found in token');
    }
    return currentUser.companyId;
  }

  private ensureCompanyScope(currentUser: any, companyId: string) {
    if (currentUser.companyId && currentUser.companyId !== companyId) {
      throw new ForbiddenException('You can only act within your own company');
    }
  }

  private ensureDateRange(startDate?: Date | null, endDate?: Date | null) {
    if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }
  }

  private ensureProjectWritable(status: ProjectStatus) {
    if (status !== ProjectStatus.ACTIVE) {
      throw new BadRequestException(
        'Completed or archived projects are read-only. Set project status to ACTIVE first.',
      );
    }
  }

  private async resolveCurrentEmployee(currentUser: any) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: currentUser.id },
      select: {
        id: true,
        companyId: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found for current user');
    }

    this.ensureCompanyScope(currentUser, employee.companyId);
    return employee;
  }

  private async getProjectForCompany(projectId: string, currentUser: any) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    this.ensureCompanyScope(currentUser, project.companyId);
    return project;
  }

  private async getProjectForMember(projectId: string, currentUser: any) {
    const employee = await this.resolveCurrentEmployee(currentUser);

    const membership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_employeeId: {
          projectId,
          employeeId: employee.id,
        },
      },
      include: {
        project: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You can only access projects where you are a member');
    }

    this.ensureCompanyScope(currentUser, membership.project.companyId);

    return {
      employee,
      project: membership.project,
    };
  }

  private async getTaskForCompany(taskId: string, currentUser: any) {
    const task = await this.prisma.projectTask.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    this.ensureCompanyScope(currentUser, task.companyId);
    return task;
  }

  private async getTaskForMember(taskId: string, currentUser: any) {
    const employee = await this.resolveCurrentEmployee(currentUser);

    const task = await this.prisma.projectTask.findFirst({
      where: {
        id: taskId,
        project: {
          members: {
            some: {
              employeeId: employee.id,
            },
          },
        },
      },
      include: {
        project: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    this.ensureCompanyScope(currentUser, task.companyId);

    return {
      employee,
      task,
    };
  }

  private async ensureAssigneeIsProjectMember(
    projectId: string,
    companyId: string,
    assigneeEmployeeId?: string,
  ) {
    if (!assigneeEmployeeId) {
      return;
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_employeeId: {
          projectId,
          employeeId: assigneeEmployeeId,
        },
      },
      include: {
        employee: {
          select: {
            companyId: true,
            status: true,
          },
        },
      },
    });

    if (!membership || membership.employee.companyId !== companyId) {
      throw new BadRequestException('Assignee must be a member of this project');
    }

    if (membership.employee.status === 'terminated') {
      throw new BadRequestException('Cannot assign tasks to terminated employees');
    }
  }

  private buildTaskWhere(projectId: string, filter: FilterProjectTasksDto) {
    const where: any = { projectId };

    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.priority) {
      where.priority = filter.priority;
    }
    if (filter.assigneeEmployeeId) {
      where.assigneeEmployeeId = filter.assigneeEmployeeId;
    }
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter.dueDateFrom || filter.dueDateTo) {
      where.dueDate = {
        ...(filter.dueDateFrom ? { gte: filter.dueDateFrom } : {}),
        ...(filter.dueDateTo ? { lte: filter.dueDateTo } : {}),
      };
    }

    return where;
  }

  async createProject(dto: CreateProjectDto, currentUser: any) {
    this.ensureAdminOrHr(currentUser);
    const companyId = this.ensureCompanyId(currentUser);

    this.ensureDateRange(dto.startDate, dto.endDate);

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, status: true },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.status !== 'active') {
      throw new BadRequestException('Cannot create projects for a suspended or archived company');
    }

    const project = await this.prisma.project.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        startDate: dto.startDate,
        endDate: dto.endDate,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      include: {
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
      },
    });

    return {
      message: 'Project created successfully',
      data: project,
    };
  }

  async findAllAdmin(filter: FilterProjectsDto, currentUser: any) {
    this.ensureAdminOrHr(currentUser);
    const companyId = this.ensureCompanyId(currentUser);

    const { skip, take, page, limit } = getPagination(filter.page, filter.limit);

    const where: any = { companyId };
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.project.count({ where });
    const data = await this.prisma.project.findMany({
      where,
      skip,
      take,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    const dataWithSummaries = await this.attachTaskSummaries(data);

    return {
      message: 'Projects retrieved successfully',
      data: dataWithSummaries,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findByIdAdmin(projectId: string, currentUser: any) {
    this.ensureAdminOrHr(currentUser);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          orderBy: { createdAt: 'asc' },
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                status: true,
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
            addedBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    this.ensureCompanyScope(currentUser, project.companyId);

    const taskStatusCounts = await this.prisma.projectTask.groupBy({
      by: ['status'],
      where: { projectId: project.id },
      _count: {
        status: true,
      },
    });

    const taskSummary: Record<ProjectTaskStatus, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      DONE: 0,
    };

    for (const row of taskStatusCounts) {
      taskSummary[row.status] = row._count.status;
    }

    return {
      message: 'Project retrieved successfully',
      data: {
        ...project,
        taskSummary,
      },
    };
  }

  async updateProject(projectId: string, dto: UpdateProjectDto, currentUser: any) {
    this.ensureAdminOrHr(currentUser);

    const project = await this.getProjectForCompany(projectId, currentUser);

    this.ensureProjectWritable(project.status);
    this.ensureDateRange(dto.startDate ?? project.startDate, dto.endDate ?? project.endDate);

    const updated = await this.prisma.project.update({
      where: { id: project.id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.startDate !== undefined ? { startDate: dto.startDate } : {}),
        ...(dto.endDate !== undefined ? { endDate: dto.endDate } : {}),
        updatedById: currentUser.id,
      },
      include: {
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
      },
    });

    return {
      message: 'Project updated successfully',
      data: updated,
    };
  }

  async updateProjectStatus(projectId: string, dto: UpdateProjectStatusDto, currentUser: any) {
    this.ensureAdminOrHr(currentUser);

    const project = await this.getProjectForCompany(projectId, currentUser);

    if (project.status === dto.status) {
      return {
        message: `Project is already ${dto.status}`,
        data: project,
      };
    }

    const updated = await this.prisma.project.update({
      where: { id: project.id },
      data: {
        status: dto.status,
        updatedById: currentUser.id,
      },
    });

    return {
      message: `Project status updated to ${dto.status}`,
      data: updated,
    };
  }

  async deleteProject(projectId: string, currentUser: any) {
    this.ensureAdminOrHr(currentUser);

    const project = await this.getProjectForCompany(projectId, currentUser);

    if (project.status !== ProjectStatus.ARCHIVED) {
      throw new BadRequestException('Only archived projects can be deleted');
    }

    await this.prisma.project.delete({
      where: { id: project.id },
    });

    return {
      message: 'Project deleted successfully',
      data: {
        id: project.id,
      },
    };
  }

  async addMembers(projectId: string, dto: AddProjectMembersDto, currentUser: any) {
    this.ensureAdminOrHr(currentUser);

    const project = await this.getProjectForCompany(projectId, currentUser);

    this.ensureProjectWritable(project.status);

    const uniqueEmployeeIds = [...new Set(dto.employeeIds)];
    if (uniqueEmployeeIds.length === 0) {
      throw new BadRequestException('At least one employee ID is required');
    }

    const employees = await this.prisma.employee.findMany({
      where: {
        id: { in: uniqueEmployeeIds },
        companyId: project.companyId,
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    if (employees.length !== uniqueEmployeeIds.length) {
      throw new BadRequestException('One or more employees do not belong to this company');
    }

    const terminatedEmployees = employees.filter((employee) => employee.status === 'terminated');
    if (terminatedEmployees.length > 0) {
      throw new BadRequestException('Terminated employees cannot be added to projects');
    }

    const existingMembers = await this.prisma.projectMember.findMany({
      where: {
        projectId: project.id,
        employeeId: { in: uniqueEmployeeIds },
      },
      select: {
        employeeId: true,
      },
    });

    const existingEmployeeIds = new Set(existingMembers.map((member) => member.employeeId));
    const toCreate = uniqueEmployeeIds.filter((employeeId) => !existingEmployeeIds.has(employeeId));

    if (toCreate.length === 0) {
      return {
        message: 'All selected employees are already members of this project',
        data: {
          addedCount: 0,
          skippedCount: uniqueEmployeeIds.length,
          members: [],
        },
      };
    }

    const members = await this.prisma.$transaction(
      toCreate.map((employeeId) =>
        this.prisma.projectMember.create({
          data: {
            projectId: project.id,
            employeeId,
            addedById: currentUser.id,
          },
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                status: true,
              },
            },
            addedBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        }),
      ),
    );

    return {
      message: 'Project members added successfully',
      data: {
        addedCount: members.length,
        skippedCount: uniqueEmployeeIds.length - members.length,
        members,
      },
    };
  }

  async removeMember(projectId: string, employeeId: string, currentUser: any) {
    this.ensureAdminOrHr(currentUser);

    const project = await this.getProjectForCompany(projectId, currentUser);

    this.ensureProjectWritable(project.status);

    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_employeeId: {
          projectId: project.id,
          employeeId,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Employee is not a member of this project');
    }

    const assignedOpenTasks = await this.prisma.projectTask.count({
      where: {
        projectId: project.id,
        assigneeEmployeeId: employeeId,
        status: {
          not: ProjectTaskStatus.DONE,
        },
      },
    });

    if (assignedOpenTasks > 0) {
      throw new BadRequestException(
        'Member cannot be removed because they still have assigned tasks in TODO/IN_PROGRESS/REVIEW.',
      );
    }

    await this.prisma.projectMember.delete({
      where: {
        projectId_employeeId: {
          projectId: project.id,
          employeeId,
        },
      },
    });

    return {
      message: 'Project member removed successfully',
      data: {
        removedEmployee: member.employee,
      },
    };
  }

  async createTask(projectId: string, dto: CreateProjectTaskDto, currentUser: any) {
    this.ensureAdminOrHr(currentUser);

    const project = await this.getProjectForCompany(projectId, currentUser);

    this.ensureProjectWritable(project.status);
    await this.ensureAssigneeIsProjectMember(project.id, project.companyId, dto.assigneeEmployeeId);

    const task = await this.prisma.projectTask.create({
      data: {
        projectId: project.id,
        companyId: project.companyId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'MEDIUM',
        dueDate: dto.dueDate,
        assigneeEmployeeId: dto.assigneeEmployeeId,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      include: {
        assigneeEmployee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    return {
      message: 'Project task created successfully',
      data: task,
    };
  }

  async findTasksAdmin(projectId: string, filter: FilterProjectTasksDto, currentUser: any) {
    this.ensureAdminOrHr(currentUser);
    await this.getProjectForCompany(projectId, currentUser);

    const { skip, take, page, limit } = getPagination(filter.page, filter.limit);
    const where = this.buildTaskWhere(projectId, filter);

    const total = await this.prisma.projectTask.count({ where });
    const data = await this.prisma.projectTask.findMany({
      where,
      skip,
      take,
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        assigneeEmployee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    return {
      message: 'Project tasks retrieved successfully',
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findTaskByIdAdmin(taskId: string, currentUser: any) {
    this.ensureAdminOrHr(currentUser);

    const task = await this.prisma.projectTask.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        assigneeEmployee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    this.ensureCompanyScope(currentUser, task.companyId);

    return {
      message: 'Project task retrieved successfully',
      data: task,
    };
  }

  async updateTask(taskId: string, dto: UpdateProjectTaskDto, currentUser: any) {
    this.ensureAdminOrHr(currentUser);

    const task = await this.getTaskForCompany(taskId, currentUser);

    this.ensureProjectWritable(task.project.status);
    await this.ensureAssigneeIsProjectMember(task.projectId, task.companyId, dto.assigneeEmployeeId);

    const updated = await this.prisma.projectTask.update({
      where: { id: task.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate } : {}),
        ...(dto.assigneeEmployeeId !== undefined
          ? { assigneeEmployeeId: dto.assigneeEmployeeId }
          : {}),
        updatedById: currentUser.id,
      },
      include: {
        assigneeEmployee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    return {
      message: 'Project task updated successfully',
      data: updated,
    };
  }

  async updateTaskStatusAdmin(taskId: string, dto: UpdateProjectTaskStatusDto, currentUser: any) {
    this.ensureAdminOrHr(currentUser);

    const task = await this.getTaskForCompany(taskId, currentUser);

    this.ensureProjectWritable(task.project.status);

    const updated = await this.prisma.projectTask.update({
      where: { id: task.id },
      data: {
        status: dto.status,
        updatedById: currentUser.id,
      },
    });

    return {
      message: `Task status updated to ${dto.status}`,
      data: updated,
    };
  }

  async findTaskCommentsAdmin(taskId: string, pagination: PaginationDto, currentUser: any) {
    this.ensureAdminOrHr(currentUser);

    await this.getTaskForCompany(taskId, currentUser);

    const { skip, take, page, limit } = getPagination(pagination.page, pagination.limit);

    const where = { taskId };

    const total = await this.prisma.projectTaskComment.count({ where });
    const data = await this.prisma.projectTaskComment.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'asc' },
      include: {
        authorUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Task comments retrieved successfully',
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async addTaskCommentAdmin(taskId: string, dto: AddProjectTaskCommentDto, currentUser: any) {
    this.ensureAdminOrHr(currentUser);

    const task = await this.getTaskForCompany(taskId, currentUser);

    this.ensureProjectWritable(task.project.status);

    const comment = await this.prisma.projectTaskComment.create({
      data: {
        taskId: task.id,
        companyId: task.companyId,
        authorUserId: currentUser.id,
        comment: dto.comment,
      },
      include: {
        authorUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Task comment added successfully',
      data: comment,
    };
  }

  async findMyProjects(filter: FilterProjectsDto, currentUser: any) {
    const employee = await this.resolveCurrentEmployee(currentUser);
    const { skip, take, page, limit } = getPagination(filter.page, filter.limit);

    const where: any = {
      companyId: employee.companyId,
      members: {
        some: {
          employeeId: employee.id,
        },
      },
    };

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.project.count({ where });
    const data = await this.prisma.project.findMany({
      where,
      skip,
      take,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
      },
    });

    const dataWithSummaries = await this.attachTaskSummaries(data);

    return {
      message: 'My projects retrieved successfully',
      data: dataWithSummaries,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findMyProjectTasks(projectId: string, filter: FilterProjectTasksDto, currentUser: any) {
    const { project } = await this.getProjectForMember(projectId, currentUser);

    const { skip, take, page, limit } = getPagination(filter.page, filter.limit);
    const where = this.buildTaskWhere(project.id, filter);

    const total = await this.prisma.projectTask.count({ where });
    const data = await this.prisma.projectTask.findMany({
      where,
      skip,
      take,
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        assigneeEmployee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    return {
      message: 'Project tasks retrieved successfully',
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findMyTaskById(taskId: string, currentUser: any) {
    const { employee } = await this.resolveTaskAccessForMember(taskId, currentUser);

    const task = await this.prisma.projectTask.findFirst({
      where: {
        id: taskId,
        project: {
          members: {
            some: {
              employeeId: employee.id,
            },
          },
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        assigneeEmployee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return {
      message: 'Task retrieved successfully',
      data: task,
    };
  }

  private async resolveTaskAccessForMember(taskId: string, currentUser: any) {
    const access = await this.getTaskForMember(taskId, currentUser);

    return {
      employee: access.employee,
      task: access.task,
    };
  }

  async updateMyTaskStatus(taskId: string, dto: UpdateProjectTaskStatusDto, currentUser: any) {
    const { employee, task } = await this.resolveTaskAccessForMember(taskId, currentUser);

    if (task.assigneeEmployeeId !== employee.id) {
      throw new ForbiddenException('You can only update status for tasks assigned to you');
    }

    this.ensureProjectWritable(task.project.status);

    const updated = await this.prisma.projectTask.update({
      where: { id: task.id },
      data: {
        status: dto.status,
        updatedById: currentUser.id,
      },
    });

    return {
      message: `Task status updated to ${dto.status}`,
      data: updated,
    };
  }

  async findMyTaskComments(taskId: string, pagination: PaginationDto, currentUser: any) {
    const { task } = await this.resolveTaskAccessForMember(taskId, currentUser);

    const { skip, take, page, limit } = getPagination(pagination.page, pagination.limit);

    const where = { taskId: task.id };

    const total = await this.prisma.projectTaskComment.count({ where });
    const data = await this.prisma.projectTaskComment.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'asc' },
      include: {
        authorUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Task comments retrieved successfully',
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async addMyTaskComment(taskId: string, dto: AddProjectTaskCommentDto, currentUser: any) {
    const { task } = await this.resolveTaskAccessForMember(taskId, currentUser);

    this.ensureProjectWritable(task.project.status);

    const comment = await this.prisma.projectTaskComment.create({
      data: {
        taskId: task.id,
        companyId: task.companyId,
        authorUserId: currentUser.id,
        comment: dto.comment,
      },
      include: {
        authorUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Task comment added successfully',
      data: comment,
    };
  }
}
