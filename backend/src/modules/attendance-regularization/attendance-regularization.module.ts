import { Module } from '@nestjs/common';
import { AttendanceRegularizationService } from './attendance-regularization.service';
import {
  AttendanceRegularizationAdminController,
  AttendanceRegularizationEmployeeController,
} from './attendance-regularization.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [PrismaModule, AttendanceModule],
  controllers: [AttendanceRegularizationEmployeeController, AttendanceRegularizationAdminController],
  providers: [AttendanceRegularizationService],
})
export class AttendanceRegularizationModule {}
