import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ComplaintService } from './complaint.service';
import { ComplaintEmployeeController } from './complaint-employee.controller';
import { ComplaintAdminController } from './complaint-admin.controller';

@Module({
  imports: [AuthModule],
  controllers: [ComplaintEmployeeController, ComplaintAdminController],
  providers: [ComplaintService],
  exports: [ComplaintService],
})
export class ComplaintModule {}
