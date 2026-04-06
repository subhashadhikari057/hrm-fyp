import { PrismaClient, UserRole, CompanyStatus, SubscriptionStatus, EmploymentType, Gender, EmployeeStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

type SeedEmployee = {
  employeeCode: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: Gender;
  dateOfBirth: string;
  joinDate: string;
  probationEnd: string;
  employmentType: EmploymentType;
  workEmail: string;
  personalEmail: string;
  phone: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  baseSalary: number;
  allowances: number;
  isMarried: boolean;
  locationId: string;
  departmentName: string;
  designationName: string;
};

type SeedCompany = {
  name: string;
  code: string;
  industry: string;
  address: string;
  city: string;
  country: string;
  planCode: string;
  planExpiresAt: string;
  maxEmployees: number;
  admin: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
  };
  departments: { name: string; code: string; description: string }[];
  designations: { name: string; code: string; description: string }[];
  workShifts: { name: string; code: string; description: string; startHour: number; endHour: number }[];
  employees: SeedEmployee[];
};

const subscriptionPlans = [
  {
    name: 'Basic Plan',
    code: 'BASIC',
    description: 'Core HR operations for small companies.',
    monthlyPrice: 2500,
    yearlyPrice: 25000,
    maxEmployees: 25,
    features: ['attendance', 'leave', 'policy'],
  },
  {
    name: 'Silver Plan',
    code: 'SILVER',
    description: 'Extended HR workflow with collaboration features.',
    monthlyPrice: 5000,
    yearlyPrice: 50000,
    maxEmployees: 75,
    features: ['attendance', 'leave', 'projects', 'policy', 'complaints'],
  },
  {
    name: 'Gold Plan',
    code: 'GOLD',
    description: 'Full HR suite with payroll support.',
    monthlyPrice: 9000,
    yearlyPrice: 90000,
    maxEmployees: 200,
    features: ['attendance', 'leave', 'projects', 'policy', 'complaints', 'payroll'],
  },
] as const;

const companies: SeedCompany[] = [
  {
    name: 'ProtozoaHost',
    code: 'PTZ',
    industry: 'Cloud Hosting',
    address: 'Kupondole Height, Lalitpur',
    city: 'Lalitpur',
    country: 'Nepal',
    planCode: 'BASIC',
    planExpiresAt: '2026-12-31T23:59:59.000Z',
    maxEmployees: 25,
    admin: {
      fullName: 'Protozoa Host Admin',
      email: 'protozoahost@admin.com',
      password: 'protozoa123',
      phone: '+9779801001001',
    },
    departments: [
      { name: 'Operations', code: 'OPS', description: 'Infrastructure and hosting operations' },
      { name: 'Support', code: 'SUP', description: 'Customer and service support' },
      { name: 'Finance', code: 'FIN', description: 'Billing and finance operations' },
    ],
    designations: [
      { name: 'Operations Engineer', code: 'OPENG', description: 'Maintains hosting infrastructure' },
      { name: 'Support Executive', code: 'SUPEX', description: 'Handles customer issues' },
      { name: 'Finance Officer', code: 'FINOF', description: 'Manages payments and reconciliation' },
    ],
    workShifts: [
      { name: 'Day Shift', code: 'DAY', description: 'Standard day shift', startHour: 9, endHour: 18 },
      { name: 'Support Shift', code: 'SUPDAY', description: 'Customer support shift', startHour: 10, endHour: 19 },
    ],
    employees: [
      {
        employeeCode: 'PTZ-EMP-001',
        firstName: 'Animesh',
        lastName: 'Poudel',
        gender: Gender.male,
        dateOfBirth: '1998-06-12',
        joinDate: '2024-01-10',
        probationEnd: '2024-04-10',
        employmentType: EmploymentType.full_time,
        workEmail: 'animesh.poudel@protozoahost.com',
        personalEmail: 'animesh.demo@gmail.com',
        phone: '+9779801002001',
        address: 'Satdobato, Lalitpur',
        emergencyContactName: 'Mina Poudel',
        emergencyContactPhone: '+9779801003001',
        baseSalary: 50000,
        allowances: 1000,
        isMarried: true,
        locationId: 'KTM-DC-01',
        departmentName: 'Operations',
        designationName: 'Operations Engineer',
      },
      {
        employeeCode: 'PTZ-EMP-002',
        firstName: 'Srijana',
        lastName: 'Shrestha',
        gender: Gender.female,
        dateOfBirth: '1999-03-04',
        joinDate: '2024-02-15',
        probationEnd: '2024-05-15',
        employmentType: EmploymentType.full_time,
        workEmail: 'srijana.shrestha@protozoahost.com',
        personalEmail: 'srijana.demo@gmail.com',
        phone: '+9779801002002',
        address: 'Imadol, Lalitpur',
        emergencyContactName: 'Nabin Shrestha',
        emergencyContactPhone: '+9779801003002',
        baseSalary: 42000,
        allowances: 2500,
        isMarried: false,
        locationId: 'KTM-SUP-01',
        departmentName: 'Support',
        designationName: 'Support Executive',
      },
      {
        employeeCode: 'PTZ-EMP-003',
        firstName: 'Ritesh',
        lastName: 'Khanal',
        gender: Gender.male,
        dateOfBirth: '1996-11-18',
        joinDate: '2023-11-01',
        probationEnd: '2024-02-01',
        employmentType: EmploymentType.full_time,
        workEmail: 'ritesh.khanal@protozoahost.com',
        personalEmail: 'ritesh.demo@gmail.com',
        phone: '+9779801002003',
        address: 'Gwarko, Lalitpur',
        emergencyContactName: 'Sita Khanal',
        emergencyContactPhone: '+9779801003003',
        baseSalary: 38000,
        allowances: 1500,
        isMarried: true,
        locationId: 'KTM-FIN-01',
        departmentName: 'Finance',
        designationName: 'Finance Officer',
      },
    ],
  },
  {
    name: 'NomorTech',
    code: 'NMR',
    industry: 'Software Services',
    address: 'New Baneshwor, Kathmandu',
    city: 'Kathmandu',
    country: 'Nepal',
    planCode: 'SILVER',
    planExpiresAt: '2027-03-31T23:59:59.000Z',
    maxEmployees: 75,
    admin: {
      fullName: 'NomorTech Admin',
      email: 'nomor@admin.com',
      password: 'nomor123',
      phone: '+9779801101001',
    },
    departments: [
      { name: 'Engineering', code: 'ENG', description: 'Product and engineering team' },
      { name: 'People', code: 'HR', description: 'People and culture function' },
      { name: 'Sales', code: 'SAL', description: 'Business and client acquisition' },
    ],
    designations: [
      { name: 'Software Engineer', code: 'SWE', description: 'Builds platform features' },
      { name: 'HR Executive', code: 'HREX', description: 'Supports HR operations' },
      { name: 'Sales Associate', code: 'SASC', description: 'Manages client outreach' },
    ],
    workShifts: [
      { name: 'Corporate Shift', code: 'CORP', description: 'Regular office shift', startHour: 9, endHour: 17 },
      { name: 'Extended Shift', code: 'EXT', description: 'Project delivery shift', startHour: 11, endHour: 20 },
    ],
    employees: [
      {
        employeeCode: 'NMR-EMP-001',
        firstName: 'Prabesh',
        lastName: 'Dahal',
        gender: Gender.male,
        dateOfBirth: '1997-08-10',
        joinDate: '2023-09-15',
        probationEnd: '2023-12-15',
        employmentType: EmploymentType.full_time,
        workEmail: 'prabesh.dahal@nomortech.com',
        personalEmail: 'prabesh.demo@gmail.com',
        phone: '+9779801102001',
        address: 'Maitidevi, Kathmandu',
        emergencyContactName: 'Bina Dahal',
        emergencyContactPhone: '+9779801103001',
        baseSalary: 70000,
        allowances: 5000,
        isMarried: false,
        locationId: 'KTM-ENG-01',
        departmentName: 'Engineering',
        designationName: 'Software Engineer',
      },
      {
        employeeCode: 'NMR-EMP-002',
        firstName: 'Asmita',
        lastName: 'Bista',
        gender: Gender.female,
        dateOfBirth: '1998-12-22',
        joinDate: '2024-01-07',
        probationEnd: '2024-04-07',
        employmentType: EmploymentType.full_time,
        workEmail: 'asmita.bista@nomortech.com',
        personalEmail: 'asmita.demo@gmail.com',
        phone: '+9779801102002',
        address: 'Sinamangal, Kathmandu',
        emergencyContactName: 'Rina Bista',
        emergencyContactPhone: '+9779801103002',
        baseSalary: 48000,
        allowances: 3000,
        isMarried: true,
        locationId: 'KTM-HR-01',
        departmentName: 'People',
        designationName: 'HR Executive',
      },
      {
        employeeCode: 'NMR-EMP-003',
        firstName: 'Suman',
        lastName: 'Thapa',
        gender: Gender.male,
        dateOfBirth: '1995-01-30',
        joinDate: '2022-07-01',
        probationEnd: '2022-10-01',
        employmentType: EmploymentType.full_time,
        workEmail: 'suman.thapa@nomortech.com',
        personalEmail: 'suman.demo@gmail.com',
        phone: '+9779801102003',
        address: 'Koteshwor, Kathmandu',
        emergencyContactName: 'Kalpana Thapa',
        emergencyContactPhone: '+9779801103003',
        baseSalary: 55000,
        allowances: 4000,
        isMarried: true,
        locationId: 'KTM-SALES-01',
        departmentName: 'Sales',
        designationName: 'Sales Associate',
      },
    ],
  },
  {
    name: 'LimiCreatives',
    code: 'LMC',
    industry: 'Creative Agency',
    address: 'Jhamsikhel, Lalitpur',
    city: 'Lalitpur',
    country: 'Nepal',
    planCode: 'GOLD',
    planExpiresAt: '2027-06-30T23:59:59.000Z',
    maxEmployees: 200,
    admin: {
      fullName: 'LimiCreatives Admin',
      email: 'limi@admin.com',
      password: 'limi123',
      phone: '+9779801201001',
    },
    departments: [
      { name: 'Creative', code: 'CRTV', description: 'Design and creative production' },
      { name: 'Marketing', code: 'MKT', description: 'Brand and campaign team' },
      { name: 'Accounts', code: 'ACC', description: 'Accounts and reporting' },
    ],
    designations: [
      { name: 'Graphic Designer', code: 'GD', description: 'Handles brand design and creatives' },
      { name: 'Marketing Specialist', code: 'MKS', description: 'Runs campaigns and promotions' },
      { name: 'Account Executive', code: 'ACEX', description: 'Handles billing and financial operations' },
    ],
    workShifts: [
      { name: 'Studio Shift', code: 'STD', description: 'Creative production shift', startHour: 10, endHour: 18 },
      { name: 'Client Shift', code: 'CLT', description: 'Client coordination shift', startHour: 9, endHour: 17 },
    ],
    employees: [
      {
        employeeCode: 'LMC-EMP-001',
        firstName: 'Niraj',
        lastName: 'Karki',
        gender: Gender.male,
        dateOfBirth: '1996-04-17',
        joinDate: '2023-05-20',
        probationEnd: '2023-08-20',
        employmentType: EmploymentType.full_time,
        workEmail: 'niraj.karki@limicreatives.com',
        personalEmail: 'niraj.demo@gmail.com',
        phone: '+9779801202001',
        address: 'Pulchowk, Lalitpur',
        emergencyContactName: 'Sarita Karki',
        emergencyContactPhone: '+9779801203001',
        baseSalary: 65000,
        allowances: 7000,
        isMarried: true,
        locationId: 'LAL-CRT-01',
        departmentName: 'Creative',
        designationName: 'Graphic Designer',
      },
      {
        employeeCode: 'LMC-EMP-002',
        firstName: 'Pallavi',
        lastName: 'Joshi',
        gender: Gender.female,
        dateOfBirth: '1999-09-09',
        joinDate: '2024-03-11',
        probationEnd: '2024-06-11',
        employmentType: EmploymentType.full_time,
        workEmail: 'pallavi.joshi@limicreatives.com',
        personalEmail: 'pallavi.demo@gmail.com',
        phone: '+9779801202002',
        address: 'Sanepa, Lalitpur',
        emergencyContactName: 'Raju Joshi',
        emergencyContactPhone: '+9779801203002',
        baseSalary: 52000,
        allowances: 3500,
        isMarried: false,
        locationId: 'LAL-MKT-01',
        departmentName: 'Marketing',
        designationName: 'Marketing Specialist',
      },
      {
        employeeCode: 'LMC-EMP-003',
        firstName: 'Bikesh',
        lastName: 'Rana',
        gender: Gender.male,
        dateOfBirth: '1994-02-14',
        joinDate: '2022-10-05',
        probationEnd: '2023-01-05',
        employmentType: EmploymentType.full_time,
        workEmail: 'bikesh.rana@limicreatives.com',
        personalEmail: 'bikesh.demo@gmail.com',
        phone: '+9779801202003',
        address: 'Bhaisepati, Lalitpur',
        emergencyContactName: 'Manita Rana',
        emergencyContactPhone: '+9779801203003',
        baseSalary: 47000,
        allowances: 2500,
        isMarried: true,
        locationId: 'LAL-ACC-01',
        departmentName: 'Accounts',
        designationName: 'Account Executive',
      },
    ],
  },
];

function timeForHour(hour: number) {
  return new Date(Date.UTC(1970, 0, 1, hour, 0, 0));
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
  const planMap = new Map<string, Awaited<ReturnType<typeof prisma.subscriptionPlan.upsert>>>();
  for (const plan of subscriptionPlans) {
    const result = await prisma.subscriptionPlan.upsert({
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
    planMap.set(plan.code, result);
  }
  return planMap;
}

async function upsertCompanyData(companySeed: SeedCompany, planId: string) {
  const company = await prisma.company.upsert({
    where: { code: companySeed.code },
    update: {
      name: companySeed.name,
      industry: companySeed.industry,
      address: companySeed.address,
      city: companySeed.city,
      country: companySeed.country,
      planExpiresAt: new Date(companySeed.planExpiresAt),
      maxEmployees: companySeed.maxEmployees,
      subscriptionPlanId: planId,
      subscriptionStatus: SubscriptionStatus.active,
      subscriptionAssignedAt: new Date(),
      status: CompanyStatus.active,
      enableTaxDeduction: true,
      enableEmployeeSsf: true,
      enableEmployerSsf: true,
      employeeSsfRate: 0.11,
      employerSsfRate: 0.2,
    },
    create: {
      name: companySeed.name,
      code: companySeed.code,
      industry: companySeed.industry,
      address: companySeed.address,
      city: companySeed.city,
      country: companySeed.country,
      planExpiresAt: new Date(companySeed.planExpiresAt),
      maxEmployees: companySeed.maxEmployees,
      subscriptionPlanId: planId,
      subscriptionStatus: SubscriptionStatus.active,
      subscriptionAssignedAt: new Date(),
      status: CompanyStatus.active,
      enableTaxDeduction: true,
      enableEmployeeSsf: true,
      enableEmployerSsf: true,
      employeeSsfRate: 0.11,
      employerSsfRate: 0.2,
    },
  });

  const adminPassword = await bcrypt.hash(companySeed.admin.password, SALT_ROUNDS);
  const adminUser = await prisma.user.upsert({
    where: { email: companySeed.admin.email },
    update: {
      password: adminPassword,
      fullName: companySeed.admin.fullName,
      phone: companySeed.admin.phone,
      role: UserRole.company_admin,
      companyId: company.id,
      isActive: true,
    },
    create: {
      email: companySeed.admin.email,
      password: adminPassword,
      fullName: companySeed.admin.fullName,
      phone: companySeed.admin.phone,
      role: UserRole.company_admin,
      companyId: company.id,
      isActive: true,
    },
  });

  const departments = new Map<string, string>();
  for (const department of companySeed.departments) {
    const created = await prisma.department.upsert({
      where: { companyId_name: { companyId: company.id, name: department.name } },
      update: {
        code: department.code,
        description: department.description,
        isActive: true,
      },
      create: {
        companyId: company.id,
        name: department.name,
        code: department.code,
        description: department.description,
        isActive: true,
      },
    });
    departments.set(department.name, created.id);
  }

  const designations = new Map<string, string>();
  for (const designation of companySeed.designations) {
    const created = await prisma.designation.upsert({
      where: { companyId_name: { companyId: company.id, name: designation.name } },
      update: {
        code: designation.code,
        description: designation.description,
        isActive: true,
      },
      create: {
        companyId: company.id,
        name: designation.name,
        code: designation.code,
        description: designation.description,
        isActive: true,
      },
    });
    designations.set(designation.name, created.id);
  }

  const workShifts = new Map<string, string>();
  for (const shift of companySeed.workShifts) {
    const created = await prisma.workShift.upsert({
      where: { companyId_name: { companyId: company.id, name: shift.name } },
      update: {
        code: shift.code,
        description: shift.description,
        startTime: timeForHour(shift.startHour),
        endTime: timeForHour(shift.endHour),
        isActive: true,
      },
      create: {
        companyId: company.id,
        name: shift.name,
        code: shift.code,
        description: shift.description,
        startTime: timeForHour(shift.startHour),
        endTime: timeForHour(shift.endHour),
        isActive: true,
      },
    });
    workShifts.set(shift.name, created.id);
  }

  for (const employeeSeed of companySeed.employees) {
    const employeePassword = await bcrypt.hash('employee123', SALT_ROUNDS);
    const user = await prisma.user.upsert({
      where: { email: employeeSeed.workEmail },
      update: {
        password: employeePassword,
        fullName: `${employeeSeed.firstName} ${employeeSeed.lastName}`,
        phone: employeeSeed.phone,
        role: UserRole.employee,
        companyId: company.id,
        isActive: true,
      },
      create: {
        email: employeeSeed.workEmail,
        password: employeePassword,
        fullName: `${employeeSeed.firstName} ${employeeSeed.lastName}`,
        phone: employeeSeed.phone,
        role: UserRole.employee,
        companyId: company.id,
        isActive: true,
      },
    });

    const employee = await prisma.employee.upsert({
      where: { userId: user.id },
      update: {
        companyId: company.id,
        departmentId: departments.get(employeeSeed.departmentName),
        designationId: designations.get(employeeSeed.designationName),
        workShiftId: workShifts.get(companySeed.workShifts[0].name),
        employeeCode: employeeSeed.employeeCode,
        firstName: employeeSeed.firstName,
        lastName: employeeSeed.lastName,
        middleName: employeeSeed.middleName || null,
        gender: employeeSeed.gender,
        dateOfBirth: new Date(employeeSeed.dateOfBirth),
        joinDate: new Date(employeeSeed.joinDate),
        probationEnd: new Date(employeeSeed.probationEnd),
        employmentType: employeeSeed.employmentType,
        locationId: employeeSeed.locationId,
        workEmail: employeeSeed.workEmail,
        personalEmail: employeeSeed.personalEmail,
        phone: employeeSeed.phone,
        address: employeeSeed.address,
        emergencyContactName: employeeSeed.emergencyContactName,
        emergencyContactPhone: employeeSeed.emergencyContactPhone,
        baseSalary: employeeSeed.baseSalary,
        allowances: employeeSeed.allowances,
        isMarried: employeeSeed.isMarried,
        status: EmployeeStatus.active,
      },
      create: {
        userId: user.id,
        companyId: company.id,
        departmentId: departments.get(employeeSeed.departmentName),
        designationId: designations.get(employeeSeed.designationName),
        workShiftId: workShifts.get(companySeed.workShifts[0].name),
        employeeCode: employeeSeed.employeeCode,
        firstName: employeeSeed.firstName,
        lastName: employeeSeed.lastName,
        middleName: employeeSeed.middleName || null,
        gender: employeeSeed.gender,
        dateOfBirth: new Date(employeeSeed.dateOfBirth),
        joinDate: new Date(employeeSeed.joinDate),
        probationEnd: new Date(employeeSeed.probationEnd),
        employmentType: employeeSeed.employmentType,
        locationId: employeeSeed.locationId,
        workEmail: employeeSeed.workEmail,
        personalEmail: employeeSeed.personalEmail,
        phone: employeeSeed.phone,
        address: employeeSeed.address,
        emergencyContactName: employeeSeed.emergencyContactName,
        emergencyContactPhone: employeeSeed.emergencyContactPhone,
        baseSalary: employeeSeed.baseSalary,
        allowances: employeeSeed.allowances,
        isMarried: employeeSeed.isMarried,
        status: EmployeeStatus.active,
      },
    });

    const existingHistory = await prisma.employeeCompensationHistory.findFirst({
      where: { employeeId: employee.id },
    });

    if (!existingHistory) {
      await prisma.employeeCompensationHistory.create({
        data: {
          employeeId: employee.id,
          companyId: company.id,
          previousBaseSalary: null,
          newBaseSalary: employeeSeed.baseSalary,
          previousAllowances: null,
          newAllowances: employeeSeed.allowances,
          changeType: 'initial',
          effectiveFrom: new Date(employeeSeed.joinDate),
          changedAt: new Date(employeeSeed.joinDate),
          changedById: adminUser.id,
          notes: 'Seeded initial compensation',
        },
      });
    }
  }
}

async function main() {
  console.log('Seeding demo data...');
  await upsertSuperAdmin();
  const planMap = await upsertPlans();

  for (const company of companies) {
    const plan = planMap.get(company.planCode);
    if (!plan) throw new Error(`Missing subscription plan for code ${company.planCode}`);
    await upsertCompanyData(company, plan.id);
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
