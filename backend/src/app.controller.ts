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
}
