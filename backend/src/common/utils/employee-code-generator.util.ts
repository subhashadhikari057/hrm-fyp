import { PrismaService } from '../../prisma/prisma.service';

export class EmployeeCodeGeneratorUtil {
  /**
   * Generate a unique employee code for a company
   * Format: EMP001, EMP002, etc. (or custom format if company has a code)
   */
  static async generate(prisma: PrismaService, companyId: string): Promise<string> {
    // Get company info to check if it has a custom code
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { code: true },
    });

    // Use company code prefix if available, otherwise use "EMP"
    const prefix = company?.code ? company.code.toUpperCase() : 'EMP';

    // Find the highest existing employee code number for this company
    const existingEmployees = await prisma.employee.findMany({
      where: {
        companyId,
        employeeCode: {
          startsWith: prefix,
        },
      },
      select: {
        employeeCode: true,
      },
      orderBy: {
        employeeCode: 'desc',
      },
      take: 1,
    });

    let nextNumber = 1;

    if (existingEmployees.length > 0) {
      // Extract number from existing code (e.g., "EMP001" -> 1, "EMP123" -> 123)
      const lastCode = existingEmployees[0].employeeCode;
      const match = lastCode.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0], 10) + 1;
      }
    }

    // Format with leading zeros (e.g., 1 -> "001", 123 -> "123")
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    const generatedCode = `${prefix}${paddedNumber}`;

    // Double-check uniqueness (in case of race condition)
    const exists = await prisma.employee.findFirst({
      where: {
        companyId,
        employeeCode: generatedCode,
      },
    });

    if (exists) {
      // If exists, try next number
      return this.generate(prisma, companyId);
    }

    return generatedCode;
  }

  /**
   * Generate employee code with custom format
   * Format: {PREFIX}-{YEAR}-{SEQUENCE}
   * Example: ACME-2024-001
   */
  static async generateWithYear(
    prisma: PrismaService,
    companyId: string,
    companyCode?: string,
  ): Promise<string> {
    const prefix = companyCode ? companyCode.toUpperCase() : 'EMP';
    const year = new Date().getFullYear();

    // Find the highest existing employee code number for this company and year
    const existingEmployees = await prisma.employee.findMany({
      where: {
        companyId,
        employeeCode: {
          startsWith: `${prefix}-${year}-`,
        },
      },
      select: {
        employeeCode: true,
      },
      orderBy: {
        employeeCode: 'desc',
      },
      take: 1,
    });

    let nextNumber = 1;

    if (existingEmployees.length > 0) {
      const lastCode = existingEmployees[0].employeeCode;
      const match = lastCode.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const paddedNumber = nextNumber.toString().padStart(3, '0');
    const generatedCode = `${prefix}-${year}-${paddedNumber}`;

    // Double-check uniqueness
    const exists = await prisma.employee.findFirst({
      where: {
        companyId,
        employeeCode: generatedCode,
      },
    });

    if (exists) {
      return this.generateWithYear(prisma, companyId, companyCode);
    }

    return generatedCode;
  }
}

