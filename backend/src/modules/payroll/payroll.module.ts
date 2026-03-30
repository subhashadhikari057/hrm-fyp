import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PayrollAdminController } from './payroll-admin.controller';
import { PayrollEmployeeController } from './payroll-employee.controller';
import { PayrollService } from './payroll.service';

@Module({
  imports: [AuthModule],
  controllers: [PayrollAdminController, PayrollEmployeeController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
