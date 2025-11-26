import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityLogUserService } from 'src/app/userDashboard/activity-log/activity-log.service';
import { Order } from 'src/schemas/order.schema';
import { User } from 'src/schemas/user.schema';
import { Service } from 'src/schemas/service.schema';
import { Provider } from 'src/schemas/serviceProvider.schema';

export interface FindAllQuery {
  limit?: number | string;
  offset?: number | string;
  search?: string;
}

@Injectable()
export class OrderAdminService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Provider.name) private readonly providerModel: Model<Provider>,
    @InjectModel(Service.name) private readonly serviceModel: Model<Service>,
    private readonly activityLogService: ActivityLogUserService,
  ) {}

  // ✅ جلب كل الطلبات مع البحث والفلترة
  async findAll(
    { limit = 10, offset = 0, search = '' }: FindAllQuery,
    lang: string = 'ar',
  ): Promise<{ data: any[]; total: number }> {
    const safeLimit = isNaN(Number(limit)) ? 10 : Number(limit);
    const safeOffset = isNaN(Number(offset)) ? 0 : Number(offset);

    const pipeline: any[] = [{ $match: { isDeleted: false } }];

    if (search && search.trim() !== '') {
      pipeline.push({
        $match: {
          $or: [
            { orderNumber: { $regex: search, $options: 'i' } },
            { status: { $regex: search, $options: 'i' } },
            { notes: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
    );

    const langKey = lang === 'en' ? 'en' : 'ar';
    pipeline.push({
      $addFields: {
        'service.title': `$service.title.${langKey}`,
        'service.description': `$service.description.${langKey}`,
      },
    });

    pipeline.push({
      $facet: {
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: safeOffset },
          { $limit: safeLimit },
        ],
        totalCount: [{ $count: 'count' }],
      },
    });

    const result = await this.orderModel.aggregate(pipeline).exec();
    return {
      data: result[0]?.data || [],
      total: result[0]?.totalCount?.[0]?.count || 0,
    };
  }

  // ✅ تحديث حالة مستند في الطلب
  async updateDocumentStatus(
    orderId: string,
    documentId: string,
    status: 'pending' | 'approved' | 'rejected' | 'needUpdate',
    notes?: string,
  ): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new BadRequestException('الطلب غير موجود.');

    const documents = order.documentsUrl || [];
    const index = documents.findIndex((d) => d.id === documentId);
    if (index === -1) throw new BadRequestException('المستند غير موجود.');

    documents[index].status = status;
    documents[index].date = new Date();
    if (notes) documents[index].notes = notes;

    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(orderId, { documentsUrl: documents }, { new: true })
      .exec();

    await this.activityLogService.logActivity(
      updatedOrder.user,
      { ar: 'تحديث حالة المستند', en: 'Document Status Updated' },
      {
        ar: `تم تغيير حالة المستند "${documents[index].name}" إلى "${status}" في الطلب رقم ${updatedOrder.orderNumber}.`,
        en: `Document "${documents[index].name}" status changed to "${status}" in order ${updatedOrder.orderNumber}.`,
      },
      { orderId: updatedOrder._id, orderNumber: updatedOrder.orderNumber },
    );

    return updatedOrder;
  }

  async findOrdersByUserOrProvider(
    { userId, providerId, limit = 10, offset = 0 }: any,
    lang: string = 'ar',
  ) {
    const safeLimit = isNaN(Number(limit)) ? 10 : Number(limit);
    const safeOffset = isNaN(Number(offset)) ? 0 : Number(offset);

    const match: any = { isDeleted: false };
    if (userId) match.user = new Types.ObjectId(userId);

    const pipeline: any[] = [{ $match: match }];

    // Lookup + filter by provider
    if (providerId) {
      const providerObjectId = new Types.ObjectId(providerId);
      pipeline.push({
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'service',
        },
      });
      pipeline.push({
        $unwind: { path: '$service', preserveNullAndEmptyArrays: true },
      });
      pipeline.push({ $match: { 'service.provider': providerObjectId } });
    } else {
      pipeline.push({
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'service',
        },
      });
      pipeline.push({
        $unwind: { path: '$service', preserveNullAndEmptyArrays: true },
      });
    }

    // Lookup user
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    });
    pipeline.push({
      $unwind: { path: '$user', preserveNullAndEmptyArrays: true },
    });

    // Translate multilingual fields
    const langKey = lang === 'en' ? 'en' : 'ar';
    pipeline.push({
      $addFields: {
        'service.title': `$service.title.${langKey}`,
        'service.description': `$service.description.${langKey}`,
        'service.featureServices': {
          $map: {
            input: '$service.featureServices',
            as: 'f',
            in: {
              title: { $ifNull: [`$$f.title.${langKey}`, `$$f.title.ar`] },
              subtitle: {
                $ifNull: [`$$f.subtitle.${langKey}`, `$$f.subtitle.ar`],
              },
              icon: '$$f.icon',
            },
          },
        },
        'service.filesNeeded': {
          $map: {
            input: '$service.filesNeeded',
            as: 'f',
            in: { $ifNull: [`$$f.${langKey}`, `$$f.ar`] },
          },
        },
        'service.stepGetService': {
          $map: {
            input: '$service.stepGetService',
            as: 'f',
            in: { $ifNull: [`$$f.${langKey}`, `$$f.ar`] },
          },
        },
      },
    });

    // Pagination
    pipeline.push({
      $facet: {
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: safeOffset },
          { $limit: safeLimit },
        ],
        totalCount: [{ $count: 'count' }],
      },
    });

    const result = await this.orderModel.aggregate(pipeline).exec();
    return {
      orders: result[0]?.data || [],
      total: result[0]?.totalCount?.[0]?.count || 0,
    };
  }

  async getUserDashboard(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('معرف المستخدم غير صالح.');
    }

    const pipeline: any[] = [
      {
        $match: { _id: new Types.ObjectId(userId), isDeleted: false },
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders',
          pipeline: [
            { $match: { isDeleted: false } },
            {
              $lookup: {
                from: 'services',
                localField: 'service',
                foreignField: '_id',
                as: 'service',
              },
            },
            { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 1,
                orderNumber: 1,
                price: 1,
                status: 1,
                clientStage: 1,
                orderDate: 1,
                createdAt: 1,
                'service._id': 1,
                'service.title': 1,
                'service.price': 1,
                'service.image': 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          stats: {
            totalOrders: { $size: '$orders' },
            completedOrders: {
              $size: {
                $filter: {
                  input: '$orders',
                  as: 'order',
                  cond: { $eq: ['$$order.status', 'done'] },
                },
              },
            },
            inProgressOrders: {
              $size: {
                $filter: {
                  input: '$orders',
                  as: 'order',
                  cond: { $eq: ['$$order.status', 'in-progress'] },
                },
              },
            },
            totalSpent: { $sum: '$orders.price' },
          },
        },
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          email: 1,
          phone: 1,
          loyaltyPoints: 1,
          loyaltyPointsUsed: 1,
          loyaltyPointsLevel: 1,
          createdAt: 1,
          stats: 1,
          orders: 1,
        },
      },
    ];

    const result = await this.userModel.aggregate(pipeline);
    if (!result.length) throw new BadRequestException('المستخدم غير موجود.');
    return result[0];
  }

  async getProviderDashboard(providerId: string) {
    if (!Types.ObjectId.isValid(providerId)) {
      throw new BadRequestException('معرف المزود غير صالح.');
    }

    const pipeline: any[] = [
      {
        $match: { _id: new Types.ObjectId(providerId), isDeleted: false },
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: 'provider',
          as: 'services',
          pipeline: [
            { $match: { isDeleted: false } },
            {
              $lookup: {
                from: 'orders',
                localField: '_id',
                foreignField: 'service',
                as: 'orders',
                pipeline: [
                  { $match: { isDeleted: false } },
                  {
                    $lookup: {
                      from: 'users',
                      localField: 'user',
                      foreignField: '_id',
                      as: 'user',
                    },
                  },
                  {
                    $unwind: {
                      path: '$user',
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      orderNumber: 1,
                      price: 1,
                      status: 1,
                      orderDate: 1,
                      'user._id': 1,
                      'user.fullName': 1,
                      'user.email': 1,
                      'user.phone': 1,
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $addFields: {
          stats: {
            totalServices: { $size: '$services' },
            totalOrders: {
              $sum: {
                $map: {
                  input: '$services',
                  as: 'service',
                  in: { $size: '$$service.orders' },
                },
              },
            },
            completedOrders: {
              $sum: {
                $map: {
                  input: '$services',
                  as: 'service',
                  in: {
                    $size: {
                      $filter: {
                        input: '$$service.orders',
                        as: 'ord',
                        cond: { $eq: ['$$ord.status', 'done'] },
                      },
                    },
                  },
                },
              },
            },
            totalRevenue: {
              $sum: {
                $map: {
                  input: '$services',
                  as: 'service',
                  in: {
                    $sum: {
                      $map: {
                        input: {
                          $filter: {
                            input: '$$service.orders',
                            as: 'ord',
                            cond: { $eq: ['$$ord.status', 'done'] },
                          },
                        },
                        as: 'o',
                        in: '$$o.price',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          email: 1,
          phone: 1,
          status: 1,
          isVerified: 1,
          createdAt: 1,
          stats: 1,
          services: {
            _id: 1,
            title: 1,
            price: 1,
            image: 1,
            orders: 1,
          },
        },
      },
    ];

    const result = await this.providerModel.aggregate(pipeline);
    if (!result.length) throw new BadRequestException('المزود غير موجود.');
    return result[0];
  }
}
