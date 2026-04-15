import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get hello message' })
  @ApiResponse({ status: 200, description: 'Returns hello message' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get application status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns application status',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  async getStatus() {
    return this.appService.getStatus();
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system and database health' })
  @ApiResponse({
    status: 200,
    description: 'Returns system and database health status',
    schema: {
      example: {
        status: 'ok',
        message: 'System is healthy',
        timestamp: '2026-04-15T12:00:00.000Z',
        system: {
          uptimeSeconds: 5123,
          memory: {
            rss: 124133376,
            heapTotal: 69730304,
            heapUsed: 48753616,
            external: 3377199,
          },
          nodeVersion: 'v22.10.0',
          platform: 'linux',
          pid: 1,
        },
        database: {
          connected: true,
        },
      },
    },
  })
  async getHealth() {
    return this.appService.getHealth();
  }
}
