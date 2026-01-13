import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NoticeService } from './notice.service';
import { NoticeAdminController, NoticeEmployeeController } from './notice.controller';

@Module({
  imports: [PrismaModule],
  controllers: [NoticeEmployeeController, NoticeAdminController],
  providers: [NoticeService],
})
export class NoticeModule {}
