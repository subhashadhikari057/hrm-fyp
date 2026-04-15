import {
  PrismaClient,
  UserRole,
  CompanyStatus,
  SubscriptionStatus,
  EmploymentType,
  Gender,
  EmployeeStatus,
  AttendanceStatus,
  AttendanceSource,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

const COMPANY_CODE = 'NOMOR';
const COMPANY_NAME = 'Nomor LLC';
const COMPANY_ADMIN_EMAIL = 'nomor@admin.com';
const COMPANY_ADMIN_PASSWORD = 'nomoradmin123';
const NOMOR_PLAN_CODE = 'GOLD';

const subscriptionPlansSeed = [
  {
    name: 'Basic Plan',
    code: 'BASIC',
    description: 'Starter HR plan for small teams.',
    monthlyPrice: 2500,
    yearlyPrice: 25000,
    maxEmployees: 15,
    features: ['attendance', 'leave'],
  },
  {
    name: 'Silver Plan',
    code: 'SILVER',
    description: 'Mid-tier plan with collaboration tools.',
    monthlyPrice: 5000,
    yearlyPrice: 50000,
    maxEmployees: 35,
    features: ['attendance', 'leave', 'complaints', 'policy', 'projects'],
  },
  {
    name: 'Gold Plan',
    code: 'GOLD',
    description: 'Full HR suite with payroll and all premium modules.',
    monthlyPrice: 9000,
    yearlyPrice: 90000,
    maxEmployees: 100,
    features: ['attendance', 'leave', 'complaints', 'policy', 'projects', 'payroll'],
  },
] as const;

const departmentsSeed = [
  { name: 'Engineering', code: 'ENG', description: 'Builds and maintains product features.' },
  { name: 'Operations', code: 'OPS', description: 'Handles day-to-day company operations.' },
  { name: 'Finance', code: 'FIN', description: 'Manages accounting and payroll coordination.' },
] as const;

const designationsSeed = [
  { name: 'Software Engineer', code: 'SWE', description: 'Develops product features and fixes.' },
  { name: 'Operations Executive', code: 'OPEX', description: 'Coordinates company operations.' },
  { name: 'Finance Associate', code: 'FINA', description: 'Supports finance and reporting.' },
] as const;

const employeeSeed = [
  {
    employeeCode: 'NOM-EMP-001',
    firstName: 'Subhash',
    lastName: 'Adhikari',
    email: 'subhash@nomor.tech',
    password: 'subhash123',
    phone: '+9779802001001',
    address: 'Baneshwor, Kathmandu',
    emergencyContactName: 'Sita Adhikari',
    emergencyContactPhone: '+9779802009001',
    gender: Gender.male,
    departmentName: 'Engineering',
    designationName: 'Software Engineer',
    baseSalary: 65000,
    allowances: 5000,
  },
  {
    employeeCode: 'NOM-EMP-002',
    firstName: 'Urusha',
    lastName: 'Khanal',
    email: 'urusha@nomor.tech',
    password: 'urusha123',
    phone: '+9779802001002',
    address: 'Koteshwor, Kathmandu',
    emergencyContactName: 'Ramesh Khanal',
    emergencyContactPhone: '+9779802009002',
    gender: Gender.female,
    departmentName: 'Operations',
    designationName: 'Operations Executive',
    baseSalary: 52000,
    allowances: 3500,
  },
  {
    employeeCode: 'NOM-EMP-003',
    firstName: 'Asmit',
    lastName: 'Sah',
    email: 'asmit@nomor.tech',
    password: 'asmit123',
    phone: '+9779802001003',
    address: 'Maitighar, Kathmandu',
    emergencyContactName: 'Maya Sah',
    emergencyContactPhone: '+9779802009003',
    gender: Gender.male,
    departmentName: 'Finance',
    designationName: 'Finance Associate',
    baseSalary: 48000,
    allowances: 2500,
  },
] as const;

const attendancePattern: Record<string, AttendanceStatus[]> = {
  'subhash@nomor.tech': [
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.ABSENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.LATE,
    AttendanceStatus.PRESENT,
    AttendanceStatus.ABSENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.LATE,
  ],
  'urusha@nomor.tech': [
    AttendanceStatus.PRESENT,
    AttendanceStatus.ABSENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.LATE,
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.ABSENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.LATE,
    AttendanceStatus.PRESENT,
  ],
  'asmit@nomor.tech': [
    AttendanceStatus.ABSENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.LATE,
    AttendanceStatus.ABSENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.LATE,
    AttendanceStatus.PRESENT,
  ],
};

function createUtcTime(hour: number, minute = 0) {
  return new Date(Date.UTC(1970, 0, 1, hour, minute, 0));
}

function getUtcStartOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function addHours(base: Date, hour: number, minute = 0) {
  return new Date(Date.UTC(
    base.getUTCFullYear(),
    base.getUTCMonth(),
    base.getUTCDate(),
    hour,
    minute,
    0,
    0,
  ));
}

async function upsertSuperAdmin() {
  const password = await bcrypt.hash('superadmin123', SALT_ROUNDS);

  return prisma.user.upsert({
    where: { email: 'superadmin@gmail.com' },
    update: {
      password,
      fullName: 'System Super Admin',
      phone: '+9779800000000',
      role: UserRole.super_admin,
      isActive: true,
    },
    create: {
      email: 'superadmin@gmail.com',
      password,
      fullName: 'System Super Admin',
      phone: '+9779800000000',
      role: UserRole.super_admin,
      isActive: true,
    },
  });
}

async function upsertPlans() {
  const plans = new Map<string, string>();

  for (const plan of subscriptionPlansSeed) {
    const record = await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        maxEmployees: plan.maxEmployees,
        features: plan.features,
        isActive: true,
      },
      create: {
        name: plan.name,
        code: plan.code,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        maxEmployees: plan.maxEmployees,
        features: plan.features,
        isActive: true,
      },
    });

    plans.set(plan.code, record.id);
  }

  return plans;
}

async function upsertNomorCompany(planId: string) {
  return prisma.company.upsert({
    where: { code: COMPANY_CODE },
    update: {
      name: COMPANY_NAME,
      industry: 'Technology',
      address: 'New Baneshwor, Kathmandu',
      city: 'Kathmandu',
      country: 'Nepal',
      status: CompanyStatus.active,
      subscriptionStatus: SubscriptionStatus.active,
      subscriptionPlanId: planId,
      subscriptionAssignedAt: new Date(),
      planExpiresAt: new Date('2027-12-31T23:59:59.000Z'),
      maxEmployees: 50,
    },
    create: {
      name: COMPANY_NAME,
      code: COMPANY_CODE,
      industry: 'Technology',
      address: 'New Baneshwor, Kathmandu',
      city: 'Kathmandu',
      country: 'Nepal',
      status: CompanyStatus.active,
      subscriptionStatus: SubscriptionStatus.active,
      subscriptionPlanId: planId,
      subscriptionAssignedAt: new Date(),
      planExpiresAt: new Date('2027-12-31T23:59:59.000Z'),
      maxEmployees: 50,
    },
  });
}

async function upsertCompanyAdmin(companyId: string) {
  const password = await bcrypt.hash(COMPANY_ADMIN_PASSWORD, SALT_ROUNDS);

  return prisma.user.upsert({
    where: { email: COMPANY_ADMIN_EMAIL },
    update: {
      password,
      fullName: 'Nomor Admin',
      phone: '+9779802000000',
      role: UserRole.company_admin,
      companyId,
      isActive: true,
    },
    create: {
      email: COMPANY_ADMIN_EMAIL,
      password,
      fullName: 'Nomor Admin',
      phone: '+9779802000000',
      role: UserRole.company_admin,
      companyId,
      isActive: true,
    },
  });
}

async function upsertDepartments(companyId: string) {
  const map = new Map<string, string>();

  for (const department of departmentsSeed) {
    const record = await prisma.department.upsert({
      where: {
        companyId_name: {
          companyId,
          name: department.name,
        },
      },
      update: {
        code: department.code,
        description: department.description,
        isActive: true,
      },
      create: {
        companyId,
        name: department.name,
        code: department.code,
        description: department.description,
        isActive: true,
      },
    });

    map.set(department.name, record.id);
  }

  return map;
}

async function upsertDesignations(companyId: string) {
  const map = new Map<string, string>();

  for (const designation of designationsSeed) {
    const record = await prisma.designation.upsert({
      where: {
        companyId_name: {
          companyId,
          name: designation.name,
        },
      },
      update: {
        code: designation.code,
        description: designation.description,
        isActive: true,
      },
      create: {
        companyId,
        name: designation.name,
        code: designation.code,
        description: designation.description,
        isActive: true,
      },
    });

    map.set(designation.name, record.id);
  }

  return map;
}

async function upsertGeneralShift(companyId: string) {
  return prisma.workShift.upsert({
    where: {
      companyId_name: {
        companyId,
        name: 'General Shift',
      },
    },
    update: {
      code: 'GEN',
      description: 'Standard office shift',
      startTime: createUtcTime(9, 0),
      endTime: createUtcTime(17, 0),
      isActive: true,
    },
    create: {
      companyId,
      name: 'General Shift',
      code: 'GEN',
      description: 'Standard office shift',
      startTime: createUtcTime(9, 0),
      endTime: createUtcTime(17, 0),
      isActive: true,
    },
  });
}

async function upsertEmployees(
  companyId: string,
  workShiftId: string,
  departments: Map<string, string>,
  designations: Map<string, string>,
) {
  const employees: Array<{
    userId: string;
    employeeId: string;
    email: string;
    fullName: string;
  }> = [];

  for (const [index, employee] of employeeSeed.entries()) {
    const password = await bcrypt.hash(employee.password, SALT_ROUNDS);
    const fullName = `${employee.firstName} ${employee.lastName}`;

    const user = await prisma.user.upsert({
      where: { email: employee.email },
      update: {
        password,
        fullName,
        phone: employee.phone,
        role: UserRole.employee,
        companyId,
        isActive: true,
      },
      create: {
        email: employee.email,
        password,
        fullName,
        phone: employee.phone,
        role: UserRole.employee,
        companyId,
        isActive: true,
      },
    });

    const employeeRecord = await prisma.employee.upsert({
      where: { userId: user.id },
      update: {
        companyId,
        departmentId: departments.get(employee.departmentName),
        designationId: designations.get(employee.designationName),
        workShiftId,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        gender: employee.gender,
        dateOfBirth: new Date(`199${index + 4}-01-15T00:00:00.000Z`),
        joinDate: new Date(`2025-01-${String(index + 5).padStart(2, '0')}T00:00:00.000Z`),
        probationEnd: new Date(`2025-04-${String(index + 5).padStart(2, '0')}T00:00:00.000Z`),
        employmentType: EmploymentType.full_time,
        locationId: `NOM-${index + 1}`,
        workEmail: employee.email,
        personalEmail: employee.email,
        phone: employee.phone,
        address: employee.address,
        emergencyContactName: employee.emergencyContactName,
        emergencyContactPhone: employee.emergencyContactPhone,
        baseSalary: employee.baseSalary,
        allowances: employee.allowances,
        isMarried: index !== 1,
        status: EmployeeStatus.active,
      },
      create: {
        userId: user.id,
        companyId,
        departmentId: departments.get(employee.departmentName),
        designationId: designations.get(employee.designationName),
        workShiftId,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        gender: employee.gender,
        dateOfBirth: new Date(`199${index + 4}-01-15T00:00:00.000Z`),
        joinDate: new Date(`2025-01-${String(index + 5).padStart(2, '0')}T00:00:00.000Z`),
        probationEnd: new Date(`2025-04-${String(index + 5).padStart(2, '0')}T00:00:00.000Z`),
        employmentType: EmploymentType.full_time,
        locationId: `NOM-${index + 1}`,
        workEmail: employee.email,
        personalEmail: employee.email,
        phone: employee.phone,
        address: employee.address,
        emergencyContactName: employee.emergencyContactName,
        emergencyContactPhone: employee.emergencyContactPhone,
        baseSalary: employee.baseSalary,
        allowances: employee.allowances,
        isMarried: index !== 1,
        status: EmployeeStatus.active,
      },
    });

    employees.push({
      userId: user.id,
      employeeId: employeeRecord.id,
      email: employee.email,
      fullName,
    });
  }

  return employees;
}

async function upsertLeaveTypes(companyId: string) {
  const leaveTypes = [
    {
      name: 'Half General Leave',
      code: 'HGL',
      description: 'Short duration general leave for half-day absences.',
      allocatedDays: 6,
    },
    {
      name: 'Full General Leave',
      code: 'FGL',
      description: 'General purpose leave for full-day absences.',
      allocatedDays: 18,
    },
  ];

  for (const leaveType of leaveTypes) {
    await prisma.leaveType.upsert({
      where: {
        companyId_name: {
          companyId,
          name: leaveType.name,
        },
      },
      update: {
        code: leaveType.code,
        description: leaveType.description,
        allocatedDays: leaveType.allocatedDays,
        isActive: true,
      },
      create: {
        companyId,
        name: leaveType.name,
        code: leaveType.code,
        description: leaveType.description,
        allocatedDays: leaveType.allocatedDays,
        isActive: true,
      },
    });
  }
}

async function upsertAttendance(
  companyId: string,
  workShiftId: string,
  adminUserId: string,
  employees: Array<{ employeeId: string; email: string }>,
) {
  for (const employee of employees) {
    const statuses = attendancePattern[employee.email] || [];

    for (let offset = 0; offset < 10; offset += 1) {
      const date = getUtcStartOfDay(new Date(Date.now() - offset * 24 * 60 * 60 * 1000));
      const status = statuses[offset] || AttendanceStatus.PRESENT;

      const isPresentLike =
        status === AttendanceStatus.PRESENT ||
        status === AttendanceStatus.LATE ||
        status === AttendanceStatus.HALF_DAY;

      const checkInTime = isPresentLike
        ? addHours(date, status === AttendanceStatus.LATE ? 9 : 8, status === AttendanceStatus.LATE ? 35 : 55)
        : null;
      const checkOutTime = isPresentLike
        ? addHours(date, status === AttendanceStatus.HALF_DAY ? 13 : 17, status === AttendanceStatus.HALF_DAY ? 0 : 5)
        : null;
      const totalWorkMinutes =
        status === AttendanceStatus.HALF_DAY ? 240 : isPresentLike ? 490 : 0;
      const lateMinutes = status === AttendanceStatus.LATE ? 35 : 0;

      await prisma.attendanceDay.upsert({
        where: {
          employeeId_date: {
            employeeId: employee.employeeId,
            date,
          },
        },
        update: {
          companyId,
          workShiftId,
          checkInTime,
          checkOutTime,
          totalWorkMinutes,
          lateMinutes,
          overtimeMinutes: 0,
          status,
          source: AttendanceSource.ADMIN,
          notes: `Seeded ${status.toLowerCase().replace('_', ' ')} attendance record`,
          createdById: adminUserId,
          updatedById: adminUserId,
        },
        create: {
          companyId,
          employeeId: employee.employeeId,
          workShiftId,
          date,
          checkInTime,
          checkOutTime,
          totalWorkMinutes,
          lateMinutes,
          overtimeMinutes: 0,
          status,
          source: AttendanceSource.ADMIN,
          notes: `Seeded ${status.toLowerCase().replace('_', ' ')} attendance record`,
          createdById: adminUserId,
          updatedById: adminUserId,
        },
      });
    }
  }
}

async function main() {
  console.log('Seeding superadmin, subscription plans, and Nomor LLC data...');

  const superAdmin = await upsertSuperAdmin();
  const plans = await upsertPlans();
  const company = await upsertNomorCompany(plans.get(NOMOR_PLAN_CODE)!);
  const adminUser = await upsertCompanyAdmin(company.id);
  const departments = await upsertDepartments(company.id);
  const designations = await upsertDesignations(company.id);
  const shift = await upsertGeneralShift(company.id);
  const employees = await upsertEmployees(company.id, shift.id, departments, designations);

  await upsertLeaveTypes(company.id);
  await upsertAttendance(
    company.id,
    shift.id,
    adminUser.id,
    employees.map((employee) => ({
      employeeId: employee.employeeId,
      email: employee.email,
    })),
  );

  console.log('Seed complete.');
  console.log(`- Superadmin: ${superAdmin.email} / superadmin123`);
  for (const plan of subscriptionPlansSeed) {
    console.log(`- Plan: ${plan.name} (${plan.code})`);
  }
  console.log(`- Company: ${company.name} (${company.code})`);
  console.log(`- Assigned plan: ${NOMOR_PLAN_CODE}`);
  console.log(`- Company admin: ${COMPANY_ADMIN_EMAIL} / ${COMPANY_ADMIN_PASSWORD}`);
  for (const employee of employeeSeed) {
    console.log(`- Employee: ${employee.email} / ${employee.password}`);
  }
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
