import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PolicyService } from './policy.service';
import { PolicyAdminController } from './policy-admin.controller';
import { PolicyEmployeeController } from './policy-employee.controller';

@Module({
  imports: [AuthModule],
  controllers: [PolicyAdminController, PolicyEmployeeController],
  providers: [PolicyService],
  exports: [PolicyService],
})
export class PolicyModule {}
