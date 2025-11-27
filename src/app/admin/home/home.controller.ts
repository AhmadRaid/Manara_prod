import { Controller, Get } from '@nestjs/common';
import { HomeService } from './home.service';

@Controller('admin/home')
export class HomeController {
	constructor(private readonly homeService: HomeService) {}

	@Get('dashboard-stats')
	async getDashboardStats() {
		return this.homeService.getDashboardStats();
	}
}
