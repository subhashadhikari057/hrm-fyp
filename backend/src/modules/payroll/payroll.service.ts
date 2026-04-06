import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EmployeeStatus,
  PayslipLineItemType,
  PayslipStatus,
  PayrollPeriodStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { buildPaginationMeta, getPagination } from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePayrollPeriodDto } from './dto/create-payroll-period.dto';
import { FilterPayrollPeriodsDto } from './dto/filter-payroll-periods.dto';
import { FilterPayslipsDto } from './dto/filter-payslips.dto';
import { UpdatePayrollSettingsDto } from './dto/update-payroll-settings.dto';

type CurrentUser = {
  id: string;
  role: UserRole | string;
  companyId?: string | null;
};

type CompensationPoint = {
  effectiveFrom: Date;
  baseSalary: number;
  allowances: number;
};

type MonthlyCompensation = {
  year: number;
  month: number;
  startDate: Date;
  endDate: Date;
  baseSalary: number;
  allowances: number;
};

type TaxBreakdownRow = {
  label: string;
  lowerBound: number;
  upperBound: number | null;
  taxableAmount: number;
  rate: number;
  taxAmount: number;
};

type EmployeeForPayroll = Prisma.EmployeeGetPayload<{
  include: {
    user: true;
    compensationHistory: true;
  };
}>;

type PayrollPeriodForGeneration = Prisma.PayrollPeriodGetPayload<{
  include: {
    company: {
      select: {
        enableTaxDeduction: true;
        enableEmployeeSsf: true;
        enableEmployerSsf: true;
        employeeSsfRate: true;
        employerSsfRate: true;
      };
    };
  };
}>;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureAdminScope(currentUser: CurrentUser) {
    if (
      currentUser.role !== UserRole.company_admin &&
      currentUser.role !== UserRole.hr_manager
    ) {
      throw new ForbiddenException('Only company admin or HR manager can perform this action');
    }
    if (!currentUser.companyId) {
      throw new ForbiddenException('Company scope is required for payroll actions');
    }
  }

  private async ensurePayrollFeatureEnabled(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        subscriptionStatus: true,
        planExpiresAt: true,
        subscriptionPlan: {
          select: { features: true },
        },
      },
    });

    if (!company) throw new NotFoundException('Company not found');
    if (company.subscriptionStatus === 'expired' || (company.planExpiresAt && company.planExpiresAt < new Date())) {
      throw new BadRequestException('Company subscription has expired');
    }

    const features = Array.isArray(company.subscriptionPlan?.features) ? company.subscriptionPlan.features : [];
    if (features.length > 0 && !features.includes('payroll')) {
      throw new ForbiddenException('Payroll feature is not enabled for the current subscription plan');
    }
  }

  private roundCurrency(value: number) {
    return Number(value.toFixed(2));
  }

  private buildPeriodLabel(periodYear: number, periodMonth: number, customLabel?: string) {
    if (customLabel?.trim()) {
      return customLabel.trim();
    }
    return `${MONTH_NAMES[periodMonth - 1]} ${periodYear}`;
  }

  private validatePeriodDates(dto: CreatePayrollPeriodDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid payroll period dates');
    }

    if (startDate > endDate) {
      throw new BadRequestException('Payroll period start date must be before end date');
    }

    const startYear = startDate.getUTCFullYear();
    const startMonth = startDate.getUTCMonth() + 1;
    if (startYear !== dto.periodYear || startMonth !== dto.periodMonth) {
      throw new BadRequestException('Period year and month must match the start date month');
    }

    return { startDate, endDate };
  }

  private getFiscalYearWindow(periodYear: number, periodMonth: number) {
    const fiscalStartYear = periodMonth >= 7 ? periodYear : periodYear - 1;
    const startDate = new Date(Date.UTC(fiscalStartYear, 6, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(fiscalStartYear + 1, 5, 30, 23, 59, 59, 999));

    return {
      fiscalStartYear,
      fiscalEndYear: fiscalStartYear + 1,
      startDate,
      endDate,
    };
  }

  private buildFiscalMonths(periodYear: number, periodMonth: number): MonthlyCompensation[] {
    const { fiscalStartYear } = this.getFiscalYearWindow(periodYear, periodMonth);
    const months: MonthlyCompensation[] = [];

    for (let index = 0; index < 12; index += 1) {
      const date = new Date(Date.UTC(fiscalStartYear, 6 + index, 1, 0, 0, 0, 0));
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1;
      const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      months.push({
        year,
        month,
        startDate,
        endDate,
        baseSalary: 0,
        allowances: 0,
      });
    }

    return months;
  }

  private getTaxSlabs(isMarried: boolean) {
    return isMarried
      ? [
          { limit: 600_000, rate: 0.01, label: '1st Slab' },
          { limit: 800_000, rate: 0.1, label: '2nd Slab' },
          { limit: 1_100_000, rate: 0.2, label: '3rd Slab' },
          { limit: 2_000_000, rate: 0.3, label: '4th Slab' },
          { limit: Number.POSITIVE_INFINITY, rate: 0.36, label: '5th Slab' },
        ]
      : [
          { limit: 500_000, rate: 0.01, label: '1st Slab' },
          { limit: 700_000, rate: 0.1, label: '2nd Slab' },
          { limit: 1_000_000, rate: 0.2, label: '3rd Slab' },
          { limit: 2_000_000, rate: 0.3, label: '4th Slab' },
          { limit: Number.POSITIVE_INFINITY, rate: 0.36, label: '5th Slab' },
        ];
  }

  private calculateAnnualTax(taxableIncome: number, isMarried: boolean) {
    const safeIncome = Math.max(0, taxableIncome);
    const slabs = this.getTaxSlabs(isMarried);
    let remaining = safeIncome;
    let lowerBound = 0;
    let totalTax = 0;
    const breakdown: TaxBreakdownRow[] = [];

    for (const slab of slabs) {
      if (remaining <= 0) break;

      const taxableAtThisRate = Math.min(remaining, slab.limit - lowerBound);
      const slabTax = taxableAtThisRate * slab.rate;
      totalTax += slabTax;
      breakdown.push({
        label: slab.label,
        lowerBound,
        upperBound: Number.isFinite(slab.limit) ? slab.limit : null,
        taxableAmount: this.roundCurrency(taxableAtThisRate),
        rate: slab.rate,
        taxAmount: this.roundCurrency(slabTax),
      });
      remaining -= taxableAtThisRate;
      lowerBound = slab.limit;
    }

    return {
      annualTax: this.roundCurrency(totalTax),
      breakdown,
    };
  }

  private resolveCompensationTimeline(employee: EmployeeForPayroll, periodYear: number, periodMonth: number) {
    const fiscalMonths = this.buildFiscalMonths(periodYear, periodMonth);
    const compensationHistory = [...(employee.compensationHistory || [])]
      .sort((a, b) => new Date(a.effectiveFrom).getTime() - new Date(b.effectiveFrom).getTime())
      .map<CompensationPoint>((entry) => ({
        effectiveFrom: new Date(entry.effectiveFrom),
        baseSalary: Number(entry.newBaseSalary || 0),
        allowances: Number(entry.newAllowances || 0),
      }));

    const fallbackBaseSalary = Number(employee.baseSalary || 0);
    const fallbackAllowances = Number(employee.allowances || 0);
    const earliestPoint = compensationHistory[0];

    for (const month of fiscalMonths) {
      const matchingPoint = [...compensationHistory]
        .reverse()
        .find((point) => point.effectiveFrom.getTime() <= month.endDate.getTime());

      month.baseSalary = matchingPoint?.baseSalary ?? earliestPoint?.baseSalary ?? fallbackBaseSalary;
      month.allowances = matchingPoint?.allowances ?? earliestPoint?.allowances ?? fallbackAllowances;
    }

    return fiscalMonths;
  }

  private countRemainingPeriods(fiscalMonths: MonthlyCompensation[], periodYear: number, periodMonth: number) {
    return fiscalMonths.filter(
      (month) => month.year > periodYear || (month.year === periodYear && month.month >= periodMonth),
    ).length;
  }

  private async getTaxPaidToDate(employeeId: string, companyId: string, periodYear: number, periodMonth: number) {
    const { startDate, endDate } = this.getFiscalYearWindow(periodYear, periodMonth);

    const aggregate = await this.prisma.payslip.aggregate({
      where: {
        employeeId,
        companyId,
        payrollPeriod: {
          startDate: { gte: startDate },
          endDate: { lte: endDate },
          OR: [
            { periodYear: { lt: periodYear } },
            { periodYear, periodMonth: { lt: periodMonth } },
          ],
        },
      },
      _sum: {
        monthlyTds: true,
      },
    });

    return Number(aggregate._sum.monthlyTds || 0);
  }

  private buildLineItems(payload: {
    companyId: string;
    basicSalary: number;
    allowances: number;
    ssfEmployeeContribution: number;
    ssfEmployerContribution: number;
    monthlyTds: number;
  }) {
    const lineItems: Prisma.PayslipLineItemCreateManyPayslipInput[] = [
      {
        companyId: payload.companyId,
        type: PayslipLineItemType.EARNING,
        code: 'BASIC',
        title: 'Basic Salary',
        amount: this.roundCurrency(payload.basicSalary),
        sortOrder: 1,
      },
    ];

    if (payload.allowances > 0) {
      lineItems.push({
        companyId: payload.companyId,
        type: PayslipLineItemType.EARNING,
        code: 'ALLOWANCES',
        title: 'Allowances',
        amount: this.roundCurrency(payload.allowances),
        sortOrder: 2,
      });
    }

    lineItems.push(
      {
        companyId: payload.companyId,
        type: PayslipLineItemType.DEDUCTION,
        code: 'SSF_EMPLOYEE',
        title: 'SSF Employee Contribution (11%)',
        amount: this.roundCurrency(payload.ssfEmployeeContribution),
        sortOrder: 3,
      },
      {
        companyId: payload.companyId,
        type: PayslipLineItemType.EARNING,
        code: 'SSF_EMPLOYER',
        title: 'Employer SSF Contribution',
        amount: this.roundCurrency(payload.ssfEmployerContribution),
        sortOrder: 3,
      },
      {
        companyId: payload.companyId,
        type: PayslipLineItemType.DEDUCTION,
        code: 'TDS',
        title: 'Tax Deducted at Source (TDS)',
        amount: this.roundCurrency(payload.monthlyTds),
        sortOrder: 4,
      },
    );

    return lineItems;
  }

  private async buildPayslipSnapshot(period: PayrollPeriodForGeneration, employee: EmployeeForPayroll) {
    const compensationTimeline = this.resolveCompensationTimeline(employee, period.periodYear, period.periodMonth);
    const currentMonthCompensation = compensationTimeline.find(
      (month) => month.year === period.periodYear && month.month === period.periodMonth,
    );

    if (!currentMonthCompensation) {
      throw new BadRequestException('Failed to resolve payroll month compensation');
    }

    const projectedAnnualIncome = this.roundCurrency(
      compensationTimeline.reduce((sum, month) => sum + month.baseSalary + month.allowances, 0),
    );
    const employeeSsfRate = period.company.enableEmployeeSsf ? period.company.employeeSsfRate : 0;
    const employerSsfRate = period.company.enableEmployerSsf ? period.company.employerSsfRate : 0;
    const projectedAnnualSsf = this.roundCurrency(
      compensationTimeline.reduce((sum, month) => sum + month.baseSalary * employeeSsfRate, 0),
    );
    const taxableAnnualIncome = this.roundCurrency(projectedAnnualIncome - projectedAnnualSsf);
    const annualTaxResult = period.company.enableTaxDeduction
      ? this.calculateAnnualTax(taxableAnnualIncome, employee.isMarried)
      : { annualTax: 0, breakdown: [] as TaxBreakdownRow[] };
    const annualTaxLiability = annualTaxResult.annualTax;
    const taxPaidToDate = this.roundCurrency(
      await this.getTaxPaidToDate(employee.id, period.companyId, period.periodYear, period.periodMonth),
    );
    const remainingPeriods = this.countRemainingPeriods(
      compensationTimeline,
      period.periodYear,
      period.periodMonth,
    );
    const uncappedMonthlyTds = this.roundCurrency(
      remainingPeriods > 0
        ? Math.round(Math.max(0, annualTaxLiability - taxPaidToDate) / remainingPeriods)
        : 0,
    );
    const basicSalary = this.roundCurrency(currentMonthCompensation.baseSalary);
    const allowances = this.roundCurrency(currentMonthCompensation.allowances);
    const grossSalary = this.roundCurrency(basicSalary + allowances);
    const ssfEmployeeContribution = this.roundCurrency(basicSalary * employeeSsfRate);
    const ssfEmployerContribution = this.roundCurrency(basicSalary * employerSsfRate);
    const totalSsfContribution = this.roundCurrency(
      ssfEmployeeContribution + ssfEmployerContribution,
    );
    const maxDeductibleTds = Math.max(0, grossSalary - ssfEmployeeContribution);
    const monthlyTds = this.roundCurrency(Math.min(uncappedMonthlyTds, maxDeductibleTds));
    const netSalary = this.roundCurrency(grossSalary - ssfEmployeeContribution - monthlyTds);
    const remainingTax = this.roundCurrency(Math.max(0, annualTaxLiability - taxPaidToDate));

    return {
      basicSalary,
      allowances,
      grossSalary,
      ssfEmployeeContribution,
      ssfEmployerContribution,
      totalSsfContribution,
      projectedAnnualIncome,
      taxableAnnualIncome,
      annualTaxLiability,
      taxPaidToDate,
      monthlyTds,
      taxBreakdown: annualTaxResult.breakdown,
      tdsComputation: {
        annualTaxLiability,
        taxPaidToDate,
        remainingTax,
        remainingPeriods,
        uncappedMonthlyTds,
        cappedMonthlyTds: monthlyTds,
        employeeSsfRate,
        employerSsfRate,
        taxEnabled: period.company.enableTaxDeduction,
      },
      netSalary,
      isMarried: employee.isMarried,
      lineItems: this.buildLineItems({
        companyId: period.companyId,
        basicSalary,
        allowances,
        ssfEmployeeContribution,
        ssfEmployerContribution,
        monthlyTds,
      }),
    };
  }

  async createPayrollPeriod(dto: CreatePayrollPeriodDto, currentUser: CurrentUser) {
    this.ensureAdminScope(currentUser);
    await this.ensurePayrollFeatureEnabled(currentUser.companyId!);
    const { startDate, endDate } = this.validatePeriodDates(dto);

    const existing = await this.prisma.payrollPeriod.findUnique({
      where: {
        companyId_periodYear_periodMonth: {
          companyId: currentUser.companyId!,
          periodYear: dto.periodYear,
          periodMonth: dto.periodMonth,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Payroll period already exists for the selected month');
    }

    const period = await this.prisma.payrollPeriod.create({
      data: {
        companyId: currentUser.companyId!,
        fiscalYearLabel: dto.fiscalYearLabel.trim(),
        bsPeriodYear: dto.bsPeriodYear,
        bsPeriodMonth: dto.bsPeriodMonth,
        bsPeriodMonthLabel: dto.bsPeriodMonthLabel?.trim(),
        bsStartDate: dto.bsStartDate?.trim(),
        bsEndDate: dto.bsEndDate?.trim(),
        periodYear: dto.periodYear,
        periodMonth: dto.periodMonth,
        periodLabel: this.buildPeriodLabel(dto.periodYear, dto.periodMonth, dto.periodLabel),
        startDate,
        endDate,
        createdById: currentUser.id,
      },
    });

    return {
      message: 'Payroll period created successfully',
      data: period,
    };
  }

  async getPayrollSettings(currentUser: CurrentUser) {
    this.ensureAdminScope(currentUser);
    await this.ensurePayrollFeatureEnabled(currentUser.companyId!);

    const company = await this.prisma.company.findUnique({
      where: { id: currentUser.companyId! },
      select: {
        id: true,
        name: true,
        enableTaxDeduction: true,
        enableEmployeeSsf: true,
        enableEmployerSsf: true,
        employeeSsfRate: true,
        employerSsfRate: true,
      },
    });

    if (!company) throw new NotFoundException('Company not found');

    return {
      message: 'Payroll settings retrieved successfully',
      data: company,
    };
  }

  async updatePayrollSettings(dto: UpdatePayrollSettingsDto, currentUser: CurrentUser) {
    this.ensureAdminScope(currentUser);
    await this.ensurePayrollFeatureEnabled(currentUser.companyId!);

    const updated = await this.prisma.company.update({
      where: { id: currentUser.companyId! },
      data: {
        ...(dto.enableTaxDeduction !== undefined ? { enableTaxDeduction: dto.enableTaxDeduction } : {}),
        ...(dto.enableEmployeeSsf !== undefined ? { enableEmployeeSsf: dto.enableEmployeeSsf } : {}),
        ...(dto.enableEmployerSsf !== undefined ? { enableEmployerSsf: dto.enableEmployerSsf } : {}),
        ...(dto.employeeSsfRate !== undefined ? { employeeSsfRate: dto.employeeSsfRate } : {}),
        ...(dto.employerSsfRate !== undefined ? { employerSsfRate: dto.employerSsfRate } : {}),
      },
      select: {
        id: true,
        name: true,
        enableTaxDeduction: true,
        enableEmployeeSsf: true,
        enableEmployerSsf: true,
        employeeSsfRate: true,
        employerSsfRate: true,
      },
    });

    return {
      message: 'Payroll settings updated successfully',
      data: updated,
    };
  }

  async findAllPeriods(filter: FilterPayrollPeriodsDto, currentUser: CurrentUser) {
    this.ensureAdminScope(currentUser);
    await this.ensurePayrollFeatureEnabled(currentUser.companyId!);
    const { page, limit, skip, take } = getPagination(filter.page, filter.limit);

    const where: Prisma.PayrollPeriodWhereInput = {
      companyId: currentUser.companyId!,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.fiscalYearLabel ? { fiscalYearLabel: filter.fiscalYearLabel } : {}),
      ...(filter.periodYear ? { periodYear: filter.periodYear } : {}),
      ...(filter.periodMonth ? { periodMonth: filter.periodMonth } : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.payrollPeriod.count({ where }),
      this.prisma.payrollPeriod.findMany({
        where,
        skip,
        take,
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
        include: {
          _count: {
            select: {
              payslips: true,
            },
          },
        },
      }),
    ]);

    return {
      message: 'Payroll periods retrieved successfully',
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findPeriodById(periodId: string, currentUser: CurrentUser) {
    this.ensureAdminScope(currentUser);
    await this.ensurePayrollFeatureEnabled(currentUser.companyId!);

    const period = await this.prisma.payrollPeriod.findFirst({
      where: {
        id: periodId,
        companyId: currentUser.companyId!,
      },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        finalizedBy: {
          select: { id: true, fullName: true, email: true },
        },
        payslips: {
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                workEmail: true,
              },
            },
          },
        },
      },
    });

    if (!period) {
      throw new NotFoundException('Payroll period not found');
    }

    return {
      message: 'Payroll period retrieved successfully',
      data: {
        ...period,
        payslips: [...period.payslips].sort((a, b) => {
          const nameA = `${a.employee.firstName} ${a.employee.lastName}`.trim();
          const nameB = `${b.employee.firstName} ${b.employee.lastName}`.trim();
          return nameA.localeCompare(nameB);
        }),
        summary: {
          totalEmployees: period.payslips.length,
          totalGross: this.roundCurrency(period.payslips.reduce((sum, slip) => sum + slip.grossSalary, 0)),
          totalNet: this.roundCurrency(period.payslips.reduce((sum, slip) => sum + slip.netSalary, 0)),
          totalTds: this.roundCurrency(period.payslips.reduce((sum, slip) => sum + slip.monthlyTds, 0)),
          totalSsf: this.roundCurrency(
            period.payslips.reduce((sum, slip) => sum + slip.totalSsfContribution, 0),
          ),
          totalEmployeeSsf: this.roundCurrency(
            period.payslips.reduce((sum, slip) => sum + slip.ssfEmployeeContribution, 0),
          ),
          totalEmployerSsf: this.roundCurrency(
            period.payslips.reduce((sum, slip) => sum + slip.ssfEmployerContribution, 0),
          ),
        },
      },
    };
  }

  async generatePayslips(periodId: string, currentUser: CurrentUser) {
    this.ensureAdminScope(currentUser);
    await this.ensurePayrollFeatureEnabled(currentUser.companyId!);

    const period = await this.prisma.payrollPeriod.findFirst({
      where: { id: periodId, companyId: currentUser.companyId! },
      include: {
        company: {
          select: {
            enableTaxDeduction: true,
            enableEmployeeSsf: true,
            enableEmployerSsf: true,
            employeeSsfRate: true,
            employerSsfRate: true,
          },
        },
      },
    });

    if (!period) {
      throw new NotFoundException('Payroll period not found');
    }

    if (period.status === PayrollPeriodStatus.FINALIZED) {
      throw new BadRequestException('Finalized payroll periods cannot be regenerated');
    }

    const employees = await this.prisma.employee.findMany({
      where: {
        companyId: currentUser.companyId!,
        status: { in: [EmployeeStatus.active, EmployeeStatus.on_leave] },
        OR: [{ joinDate: null }, { joinDate: { lte: period.endDate } }],
      },
      include: {
        user: true,
        compensationHistory: {
          where: {
            effectiveFrom: {
              lte: this.getFiscalYearWindow(period.periodYear, period.periodMonth).endDate,
            },
          },
          orderBy: { effectiveFrom: 'asc' },
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    const generated = await this.prisma.$transaction(async (tx) => {
      await tx.payslip.deleteMany({
        where: {
          payrollPeriodId: period.id,
        },
      });

      const createdPayslips = [] as any[];

      for (const employee of employees) {
        const snapshot = await this.buildPayslipSnapshot(period, employee);
        const payslip = await tx.payslip.create({
          data: {
            payrollPeriodId: period.id,
            companyId: period.companyId,
            employeeId: employee.id,
            status: PayslipStatus.GENERATED,
            basicSalary: snapshot.basicSalary,
            allowances: snapshot.allowances,
            grossSalary: snapshot.grossSalary,
            ssfEmployeeContribution: snapshot.ssfEmployeeContribution,
            ssfEmployerContribution: snapshot.ssfEmployerContribution,
            totalSsfContribution: snapshot.totalSsfContribution,
            projectedAnnualIncome: snapshot.projectedAnnualIncome,
            taxableAnnualIncome: snapshot.taxableAnnualIncome,
            annualTaxLiability: snapshot.annualTaxLiability,
            taxPaidToDate: snapshot.taxPaidToDate,
            monthlyTds: snapshot.monthlyTds,
            taxBreakdown: snapshot.taxBreakdown,
            tdsComputation: snapshot.tdsComputation,
            netSalary: snapshot.netSalary,
            isMarried: snapshot.isMarried,
            lineItems: {
              createMany: {
                data: snapshot.lineItems,
              },
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
            lineItems: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        });

        createdPayslips.push(payslip);
      }

      await tx.payrollPeriod.update({
        where: { id: period.id },
        data: {
          status: PayrollPeriodStatus.PROCESSED,
          processedAt: new Date(),
        },
      });

      return createdPayslips;
    });

    return {
      message: 'Payroll generated successfully',
      data: {
        payrollPeriodId: period.id,
        generatedCount: generated.length,
        payslips: generated,
      },
    };
  }

  async finalizePeriod(periodId: string, currentUser: CurrentUser) {
    this.ensureAdminScope(currentUser);
    await this.ensurePayrollFeatureEnabled(currentUser.companyId!);

    const period = await this.prisma.payrollPeriod.findFirst({
      where: { id: periodId, companyId: currentUser.companyId! },
      include: {
        _count: {
          select: { payslips: true },
        },
      },
    });

    if (!period) {
      throw new NotFoundException('Payroll period not found');
    }

    if (period._count.payslips === 0) {
      throw new BadRequestException('Generate payroll before finalizing the period');
    }

    if (period.status === PayrollPeriodStatus.FINALIZED) {
      throw new BadRequestException('Payroll period is already finalized');
    }

    await this.prisma.$transaction([
      this.prisma.payslip.updateMany({
        where: { payrollPeriodId: period.id },
        data: { status: PayslipStatus.FINALIZED },
      }),
      this.prisma.payrollPeriod.update({
        where: { id: period.id },
        data: {
          status: PayrollPeriodStatus.FINALIZED,
          finalizedAt: new Date(),
          finalizedById: currentUser.id,
        },
      }),
    ]);

    return {
      message: 'Payroll period finalized successfully',
      data: {
        id: period.id,
        status: PayrollPeriodStatus.FINALIZED,
      },
    };
  }

  async findAdminPayslips(filter: FilterPayslipsDto, currentUser: CurrentUser) {
    this.ensureAdminScope(currentUser);
    await this.ensurePayrollFeatureEnabled(currentUser.companyId!);
    const { page, limit, skip, take } = getPagination(filter.page, filter.limit);

    const where: Prisma.PayslipWhereInput = {
      companyId: currentUser.companyId!,
      ...(filter.payrollPeriodId ? { payrollPeriodId: filter.payrollPeriodId } : {}),
      ...(filter.employeeId ? { employeeId: filter.employeeId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.fiscalYearLabel
        ? { payrollPeriod: { fiscalYearLabel: filter.fiscalYearLabel } }
        : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.payslip.count({ where }),
      this.prisma.payslip.findMany({
        where,
        skip,
        take,
        orderBy: { generatedAt: 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              workEmail: true,
            },
          },
          payrollPeriod: {
            select: {
              id: true,
              fiscalYearLabel: true,
              periodYear: true,
              periodMonth: true,
              periodLabel: true,
              status: true,
            },
          },
        },
      }),
    ]);

    return {
      message: 'Payslips retrieved successfully',
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getAdminPayrollSummary(currentUser: CurrentUser, fiscalYearLabel?: string) {
    this.ensureAdminScope(currentUser);
    await this.ensurePayrollFeatureEnabled(currentUser.companyId!);

    const where: Prisma.PayslipWhereInput = {
      companyId: currentUser.companyId!,
      ...(fiscalYearLabel ? { payrollPeriod: { fiscalYearLabel } } : {}),
    };

    const aggregate = await this.prisma.payslip.aggregate({
      where,
      _sum: {
        grossSalary: true,
        netSalary: true,
        monthlyTds: true,
        ssfEmployeeContribution: true,
        ssfEmployerContribution: true,
        totalSsfContribution: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      message: 'Payroll summary retrieved successfully',
      data: {
        payslipCount: aggregate._count.id,
        totalGrossSalary: this.roundCurrency(aggregate._sum.grossSalary || 0),
        totalNetSalary: this.roundCurrency(aggregate._sum.netSalary || 0),
        totalTdsPaid: this.roundCurrency(aggregate._sum.monthlyTds || 0),
        totalEmployeeSsf: this.roundCurrency(aggregate._sum.ssfEmployeeContribution || 0),
        totalEmployerSsf: this.roundCurrency(aggregate._sum.ssfEmployerContribution || 0),
        totalSsfContribution: this.roundCurrency(aggregate._sum.totalSsfContribution || 0),
      },
    };
  }

  async findAdminPayslipById(payslipId: string, currentUser: CurrentUser) {
    this.ensureAdminScope(currentUser);

    const payslip = await this.prisma.payslip.findFirst({
      where: { id: payslipId, companyId: currentUser.companyId! },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            department: {
              select: { id: true, name: true },
            },
            designation: {
              select: { id: true, name: true },
            },
          },
        },
        payrollPeriod: true,
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }

    return {
      message: 'Payslip retrieved successfully',
      data: payslip,
    };
  }

  async findMyPayslips(filter: FilterPayslipsDto, currentUser: CurrentUser) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: currentUser.id },
      select: { id: true, companyId: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    const { page, limit, skip, take } = getPagination(filter.page, filter.limit);
    const where: Prisma.PayslipWhereInput = {
      employeeId: employee.id,
      companyId: employee.companyId,
      status: PayslipStatus.FINALIZED,
      ...(filter.payrollPeriodId ? { payrollPeriodId: filter.payrollPeriodId } : {}),
      ...(filter.fiscalYearLabel ? { payrollPeriod: { fiscalYearLabel: filter.fiscalYearLabel } } : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.payslip.count({ where }),
      this.prisma.payslip.findMany({
        where,
        skip,
        take,
        orderBy: { generatedAt: 'desc' },
        include: {
          payrollPeriod: {
            select: {
              id: true,
              fiscalYearLabel: true,
              periodYear: true,
              periodMonth: true,
              periodLabel: true,
              status: true,
            },
          },
        },
      }),
    ]);

    return {
      message: 'My payslips retrieved successfully',
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getMyPayrollSummary(currentUser: CurrentUser, fiscalYearLabel?: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: currentUser.id },
      select: { id: true, companyId: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    const where: Prisma.PayslipWhereInput = {
      employeeId: employee.id,
      companyId: employee.companyId,
      status: PayslipStatus.FINALIZED,
      ...(fiscalYearLabel ? { payrollPeriod: { fiscalYearLabel } } : {}),
    };

    const aggregate = await this.prisma.payslip.aggregate({
      where,
      _sum: {
        grossSalary: true,
        netSalary: true,
        monthlyTds: true,
        ssfEmployeeContribution: true,
        ssfEmployerContribution: true,
        totalSsfContribution: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      message: 'My payroll summary retrieved successfully',
      data: {
        payslipCount: aggregate._count.id,
        totalGrossSalary: this.roundCurrency(aggregate._sum.grossSalary || 0),
        totalNetSalary: this.roundCurrency(aggregate._sum.netSalary || 0),
        totalTdsPaid: this.roundCurrency(aggregate._sum.monthlyTds || 0),
        totalEmployeeSsf: this.roundCurrency(aggregate._sum.ssfEmployeeContribution || 0),
        totalEmployerSsf: this.roundCurrency(aggregate._sum.ssfEmployerContribution || 0),
        totalSsfContribution: this.roundCurrency(aggregate._sum.totalSsfContribution || 0),
      },
    };
  }

  async findMyPayslipById(payslipId: string, currentUser: CurrentUser) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: currentUser.id },
      select: { id: true, companyId: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    const payslip = await this.prisma.payslip.findFirst({
      where: {
        id: payslipId,
        employeeId: employee.id,
        companyId: employee.companyId,
        status: PayslipStatus.FINALIZED,
      },
      include: {
        payrollPeriod: true,
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }

    return {
      message: 'Payslip retrieved successfully',
      data: payslip,
    };
  }
}
