import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

type HealthResponse = {
  status: 'ok' | 'degraded';
  message: string;
  timestamp: string;
  system: {
    uptimeSeconds: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    nodeVersion: string;
    platform: NodeJS.Platform;
    pid: number;
  };
  database: {
    connected: boolean;
    error?: string;
  };
};

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

  async getHealth(): Promise<HealthResponse> {
    let databaseConnected = false;
    let databaseError: string | null = null;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseConnected = true;
    } catch (error) {
      databaseError = error instanceof Error ? error.message : 'Unknown error';
    }

    const memoryUsage = process.memoryUsage();
    const health: HealthResponse = {
      status: databaseConnected ? 'ok' : 'degraded',
      message: databaseConnected ? 'System is healthy' : 'System is running with database issues',
      timestamp: new Date().toISOString(),
      system: {
        uptimeSeconds: Math.floor(process.uptime()),
        memory: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
        },
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
      },
      database: {
        connected: databaseConnected,
      },
    };

    if (databaseError) {
      health.database.error = databaseError;
    }

    return health;
  }
}
