import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getStatus() {
    let databaseConnected = false;
    let databaseError: string | null = null;

    try {
      // Try to query the database
      await this.prisma.$queryRaw`SELECT 1`;
      databaseConnected = true;
    } catch (error) {
      databaseError = error instanceof Error ? error.message : 'Unknown error';
    }

    const response: {
      status: string;
      message: string;
      database: { connected: boolean; error?: string };
      timestamp: string;
    } = {
      status: 'running',
      message: 'App is running',
      database: {
        connected: databaseConnected,
      },
      timestamp: new Date().toISOString(),
    };

    if (databaseError) {
      response.database.error = databaseError;
    }

    return response;
  }
}
