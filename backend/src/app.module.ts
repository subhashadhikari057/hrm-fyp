import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { UserModule } from './modules/user/user.module';
import { DepartmentModule } from './modules/department/department.module';
import { DesignationModule } from './modules/designation/designation.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { WorkShiftModule } from './modules/workshift/workshift.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AttendanceRegularizationModule } from './modules/attendance-regularization/attendance-regularization.module';
import { NoticeModule } from './modules/notice/notice.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    CompanyModule,
    UserModule,
    DepartmentModule,
    DesignationModule,
    WorkShiftModule,
    EmployeeModule,
    AttendanceModule,
    AttendanceRegularizationModule,
    NoticeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
