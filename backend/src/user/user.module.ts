import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { CompanyUserController } from './company-user.controller';
import { UserService } from './user.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UserController, CompanyUserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

