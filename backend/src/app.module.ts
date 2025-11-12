import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { UserModule } from './user/user.module';
import { DepartmentModule } from './department/department.module';

@Module({
  imports: [PrismaModule, AuthModule, CompanyModule, UserModule, DepartmentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
