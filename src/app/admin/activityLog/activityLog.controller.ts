import { Controller, Get, Query } from '@nestjs/common';
import { ActivityLogAdminService } from './activityLog.service';

@Controller('admin/activity-logs')
export class ActivityLogAdminController {
  constructor(private readonly activityService: ActivityLogAdminService) {}

  @Get()
  async getAll(
    @Query('userId') userId?: string,
    @Query('role') role?: 'user' | 'provider',
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.activityService.getAllUserActivities({ userId, role, limit, offset });
  }
}
