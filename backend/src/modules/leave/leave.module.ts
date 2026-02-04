import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LeaveService } from './leave.service';
import { LeaveTypeController } from './leave-type.controller';
import {
  LeaveRequestAdminController,
  LeaveRequestEmployeeController,
} from './leave-request.controller';

@Module({
  imports: [AuthModule],
  controllers: [
    LeaveTypeController,
    LeaveRequestEmployeeController,
    LeaveRequestAdminController,
  ],
  providers: [LeaveService],
  exports: [LeaveService],
})
export class LeaveModule {}
