import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectService } from './project.service';
import { ProjectAdminController } from './project-admin.controller';
import { ProjectEmployeeController } from './project-employee.controller';

@Module({
  imports: [AuthModule],
  controllers: [ProjectAdminController, ProjectEmployeeController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
