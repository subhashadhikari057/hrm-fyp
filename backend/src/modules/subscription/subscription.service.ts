import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginationMeta, getPagination } from '../../common/utils/pagination.util';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubscriptionPlanDto) {
    const existing = await this.prisma.subscriptionPlan.findFirst({
      where: { OR: [{ code: dto.code.trim().toUpperCase() }, { name: dto.name.trim() }] },
    });
    if (existing) throw new ConflictException('Subscription plan with same name or code already exists');

    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        description: dto.description?.trim(),
        monthlyPrice: dto.monthlyPrice ?? 0,
        yearlyPrice: dto.yearlyPrice,
        maxEmployees: dto.maxEmployees,
        features: dto.features ?? [],
        isActive: dto.isActive ?? true,
      },
      include: { _count: { select: { companies: true } } },
    });

    return { message: 'Subscription plan created successfully', data: plan };
  }

  async findAll(page?: number, limit?: number) {
    const { skip, take, page: currentPage, limit: currentLimit } = getPagination(page, limit);
    const [total, data] = await Promise.all([
      this.prisma.subscriptionPlan.count(),
      this.prisma.subscriptionPlan.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { companies: true } } },
      }),
    ]);
    return { message: 'Subscription plans retrieved successfully', data, meta: buildPaginationMeta(total, currentPage, currentLimit) };
  }

  async findOne(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { _count: { select: { companies: true } } },
    });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    return { message: 'Subscription plan retrieved successfully', data: plan };
  }

  async update(id: string, dto: UpdateSubscriptionPlanDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    if (dto.code && dto.code.trim().toUpperCase() !== plan.code) {
      const existing = await this.prisma.subscriptionPlan.findUnique({ where: { code: dto.code.trim().toUpperCase() } });
      if (existing) throw new ConflictException('Subscription plan code already exists');
    }

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.code !== undefined ? { code: dto.code.trim().toUpperCase() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.monthlyPrice !== undefined ? { monthlyPrice: dto.monthlyPrice } : {}),
        ...(dto.yearlyPrice !== undefined ? { yearlyPrice: dto.yearlyPrice } : {}),
        ...(dto.maxEmployees !== undefined ? { maxEmployees: dto.maxEmployees } : {}),
        ...(dto.features !== undefined ? { features: dto.features } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: { _count: { select: { companies: true } } },
    });

    return { message: 'Subscription plan updated successfully', data: updated };
  }
}
