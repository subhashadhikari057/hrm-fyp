import { Module } from '@nestjs/common';
import { WorkShiftController } from './workshift.controller';
import { WorkShiftService } from './workshift.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WorkShiftController],
  providers: [WorkShiftService],
  exports: [WorkShiftService],
})
export class WorkShiftModule {}
