import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';

@Injectable()
export class PolicyService {
  constructor(private readonly prisma: PrismaService) {}

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

  private async resolveCurrentEmployee(currentUser: any) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: currentUser.id },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found for current user');
    }

    return employee;
  }

  async createPolicy(dto: CreatePolicyDto, currentUser: any) {
    this.ensureAdminOrHr(currentUser);
    const companyId = this.ensureCompanyId(currentUser);

    const policy = await this.prisma.$transaction(async (tx) => {
      await tx.policy.updateMany({
        where: { companyId, isActive: true },
        data: { isActive: false },
      });

      const created = await tx.policy.create({
        data: {
          companyId,
          title: dto.title.trim(),
          isActive: true,
          createdById: currentUser.id,
        },
      });

      await tx.policyVersion.create({
        data: {
          policyId: created.id,
          companyId,
          version: '1.0.0',
          content: dto.content.trim(),
          effectiveFrom: dto.effectiveFrom ?? new Date(),
          createdById: currentUser.id,
        },
      });

      return created;
    });

    return this.getPolicyById(policy.id, currentUser);
  }

  async updatePolicy(policyId: string, dto: UpdatePolicyDto, currentUser: any) {
    this.ensureAdminOrHr(currentUser);
    const companyId = this.ensureCompanyId(currentUser);

    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
    });

    if (!policy || policy.companyId !== companyId) {
      throw new NotFoundException('Policy not found');
    }

    const nextVersion = dto.version.trim();

    const existingVersion = await this.prisma.policyVersion.findUnique({
      where: {
        policyId_version: {
          policyId: policy.id,
          version: nextVersion,
        },
      },
    });

    if (existingVersion) {
      throw new ConflictException(`Version "${nextVersion}" already exists for this policy`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.policy.updateMany({
        where: { companyId, isActive: true },
        data: { isActive: false },
      });

      await tx.policy.update({
        where: { id: policy.id },
        data: {
          title: dto.title?.trim() || policy.title,
          isActive: true,
        },
      });

      await tx.policyVersion.create({
        data: {
          policyId: policy.id,
          companyId,
          version: nextVersion,
          content: dto.content.trim(),
          effectiveFrom: dto.effectiveFrom ?? new Date(),
          createdById: currentUser.id,
        },
      });
    });

    return this.getPolicyById(policy.id, currentUser);
  }

  async listPolicies(currentUser: any) {
    this.ensureAdminOrHr(currentUser);
    const companyId = this.ensureCompanyId(currentUser);

    const data = await this.prisma.policy.findMany({
      where: { companyId },
      orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Policies retrieved successfully',
      data,
    };
  }

  async getCurrentPolicy(currentUser: any) {
    const companyId = this.ensureCompanyId(currentUser);

    const policy = await this.prisma.policy.findFirst({
      where: { companyId, isActive: true },
      orderBy: { updatedAt: 'desc' },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            createdBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Current policy retrieved successfully',
      data: policy,
    };
  }

  async getPolicyById(policyId: string, currentUser: any) {
    this.ensureAdminOrHr(currentUser);
    const companyId = this.ensureCompanyId(currentUser);

    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!policy || policy.companyId !== companyId) {
      throw new NotFoundException('Policy not found');
    }

    return {
      message: 'Policy retrieved successfully',
      data: policy,
    };
  }

  async getPendingPolicy(currentUser: any) {
    const role: UserRole = currentUser.role;
    if (!(role === 'employee' || role === 'manager')) {
      return {
        message: 'No pending policy for this role',
        data: null,
      };
    }

    const employee = await this.resolveCurrentEmployee(currentUser);

    const activePolicy = await this.prisma.policy.findFirst({
      where: {
        companyId: employee.companyId,
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!activePolicy || activePolicy.versions.length === 0) {
      return {
        message: 'No active policy found',
        data: null,
      };
    }

    const currentVersion = activePolicy.versions[0];

    const acceptance = await this.prisma.policyAcceptance.findUnique({
      where: {
        employeeId_policyVersionId: {
          employeeId: employee.id,
          policyVersionId: currentVersion.id,
        },
      },
    });

    if (acceptance) {
      return {
        message: 'Current policy already accepted',
        data: null,
      };
    }

    return {
      message: 'Pending policy acceptance required',
      data: {
        policyId: activePolicy.id,
        title: activePolicy.title,
        isActive: activePolicy.isActive,
        version: currentVersion.version,
        content: currentVersion.content,
        effectiveFrom: currentVersion.effectiveFrom,
        policyVersionId: currentVersion.id,
      },
    };
  }

  async acceptPendingPolicy(currentUser: any) {
    const employee = await this.resolveCurrentEmployee(currentUser);

    const activePolicy = await this.prisma.policy.findFirst({
      where: {
        companyId: employee.companyId,
        isActive: true,
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!activePolicy || activePolicy.versions.length === 0) {
      throw new NotFoundException('No active policy found to accept');
    }

    const currentVersion = activePolicy.versions[0];

    const acceptance = await this.prisma.policyAcceptance.upsert({
      where: {
        employeeId_policyVersionId: {
          employeeId: employee.id,
          policyVersionId: currentVersion.id,
        },
      },
      create: {
        employeeId: employee.id,
        policyVersionId: currentVersion.id,
        acceptedAt: new Date(),
      },
      update: {
        acceptedAt: new Date(),
      },
    });

    return {
      message: 'Policy accepted successfully',
      data: acceptance,
    };
  }
}
