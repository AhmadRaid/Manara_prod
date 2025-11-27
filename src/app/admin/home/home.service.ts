import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from 'src/schemas/order.schema';
import { Provider } from 'src/schemas/serviceProvider.schema';
import { Service } from 'src/schemas/service.schema';
import { User } from 'src/schemas/user.schema';
import { Blog } from 'src/schemas/blog.schema';

@Injectable()
export class HomeService {
	constructor(
		@InjectModel(Order.name) private orderModel: Model<Order>,
		@InjectModel(Provider.name) private providerModel: Model<Provider>,
		@InjectModel(Service.name) private serviceModel: Model<Service>,
		@InjectModel(User.name) private userModel: Model<User>,
		@InjectModel(Blog.name) private blogModel: Model<Blog>,
	) {}

	async getDashboardStats() {
		const [
			ordersCount,
			providersCount,
			servicesCount,
			usersCount,
			blogsCount,
			todayOrdersCount,
			lastOrders,
			lastUsers,
			lastProviders,
		] = await Promise.all([
			this.orderModel.countDocuments({ isDeleted: false }),
			this.providerModel.countDocuments({ isDeleted: false }),
			this.serviceModel.countDocuments({ isDeleted: false }),
			this.userModel.countDocuments({ isDeleted: false }),
			this.blogModel.countDocuments({ isDeleted: false }),
			this.orderModel.countDocuments({
				isDeleted: false,
				orderDate: {
					$gte: new Date(new Date().setHours(0, 0, 0, 0)),
					$lt: new Date(new Date().setHours(23, 59, 59, 999)),
				},
			}),
			this.orderModel.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5),
			this.userModel.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5),
			this.providerModel.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5),
		]);

		return {
			ordersCount,
			providersCount,
			servicesCount,
			usersCount,
			blogsCount,
			todayOrdersCount,
			lastOrders,
			lastUsers,
			lastProviders,
		};
	}
}
