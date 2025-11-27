import { Controller, Get, Query } from '@nestjs/common';
import { HomeAdminService } from './home.service';

@Controller('admin/home')
export class HomeAdminController {
	constructor(private readonly homeService: HomeAdminService) {}

	@Get()
	async getDashboardStats(@Query('lang') lang: 'ar' | 'en' = 'ar') {
		return this.homeService.getDashboardStats(lang);
	}
}
