import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceCronService } from './attendance.cron';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceCronService],
  exports: [AttendanceService],
})
export class AttendanceModule {}


