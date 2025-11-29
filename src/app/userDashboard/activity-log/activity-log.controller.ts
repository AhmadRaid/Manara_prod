import {
  Controller,
  Get,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Param,
} from '@nestjs/common';
import { ActivityLogUserService } from './activity-log.service';
import { ActivityLog } from '../../../schemas/activity-log.schema'; // تأكد من المسار
import { JwtAuthGuard } from '../../../common/guards/jwtAuthGuard'; // تأكد من المسار
import { AuthRequest } from '../../../interfaces/AuthRequest'; // تأكد من المسار

@Controller('dashboard/activity-log')
@UseGuards(JwtAuthGuard)
export class ActivityLogUserController {
  constructor(private readonly activityLogService: ActivityLogUserService) {}

  @Get()
  async getUserActivity(
    @Req() req: AuthRequest,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<ActivityLog[]> {
    const userId = req.user._id;

    const lang = req.lang;

    return this.activityLogService.getLatestActivities(userId, limit, lang);
  }

  @Get('order/:orderId')
  async getLogsByOrder(
    @Param('orderId') orderId: string,
    @Query('lang') lang: 'ar' | 'en' = 'ar',
  ) {
    return await this.activityLogService.findByOrderId(orderId, lang);
  }

  @Get('get-notifcations')
  async getLogsForOrderAndUser(
    @Param('orderId') orderId: string,
    @Req() req: AuthRequest,
    @Query('lang') lang: 'ar' | 'en' = 'ar',
  ) {
    return await this.activityLogService.getLogsForOrderAndUser(orderId, lang);
  }
}
