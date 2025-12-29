import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AttendanceService } from './attendance.service';

@Injectable()
export class AttendanceCronService {
  private readonly logger = new Logger(AttendanceCronService.name);

  constructor(private readonly attendanceService: AttendanceService) {}

  // Run daily at 23:30 Kathmandu time to mark absents for the current day.
  @Cron('0 30 23 * * *', { timeZone: 'Asia/Kathmandu' })
  async markDailyAbsents() {
    const targetDate = new Date();
    const result = await this.attendanceService.markAbsentsForAllCompanies(targetDate);

    if (result.skippedWeekend) {
      this.logger.log(`Absent cron skipped for weekend (${result.date})`);
      return;
    }

    this.logger.log(
      `Absent cron completed for ${result.date}: companies=${result.companiesProcessed}, created=${result.created}`,
    );
  }
}
