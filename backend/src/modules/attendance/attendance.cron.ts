import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AttendanceService } from './attendance.service';

@Injectable()
export class AttendanceCronService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AttendanceCronService.name);

  constructor(private readonly attendanceService: AttendanceService) {}

  onApplicationBootstrap() {
    void this.runStartupBackfill();
  }

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

  private async runStartupBackfill() {
    try {
      const todayResult = await this.attendanceService.markTodayAbsentsIfAfterCutoff(17);
      if (!todayResult.ran) {
        this.logger.log(`Startup absent check skipped: ${todayResult.reason}`);
        return;
      }

      const daily = todayResult.result;
      if (!daily) {
        this.logger.log('Startup absent check skipped: no result');
        return;
      }

      if (daily.skippedWeekend) {
        this.logger.log(`Startup absent check skipped for weekend (${daily.date})`);
        return;
      }

      this.logger.log(
        `Startup absent check completed for ${daily.date}: companies=${daily.companiesProcessed}, created=${daily.created}`,
      );
    } catch (error) {
      this.logger.error(
        'Attendance backfill failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
