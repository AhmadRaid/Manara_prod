import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActivityLogUserService } from 'src/app/userDashboard/activity-log/activity-log.service';
import { Order } from 'src/schemas/order.schema';

export interface FindAllQuery {
  limit?: number | string;
  offset?: number | string;
  search?: string;
}

@Injectable()
export class OrderAdminService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    private readonly activityLogService: ActivityLogUserService,
  ) {}

  async findAll(
    { limit = 10, offset = 0, search = '' }: FindAllQuery,
    lang: string = 'ar',
  ): Promise<{ data: any[]; total: number }> {
    // ✅ تأكد أن limit و offset أرقام صحيحة
    const safeLimit = isNaN(Number(limit)) ? 10 : Number(limit);
    const safeOffset = isNaN(Number(offset)) ? 0 : Number(offset);

    const pipeline: any[] = [];

    pipeline.push({
      $match: {
        isDeleted: false,
      },
    });

    // 🔍 البحث
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

    // 🔗 العلاقات
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

    // 🌐 اختيار اللغة
    const langKey = lang === 'en' ? 'en' : 'ar';
    pipeline.push({
      $addFields: {
        'service.title': `$service.title.${langKey}`,
        'service.description': `$service.description.${langKey}`,
      },
    });

    // 📦 pagination + count
    pipeline.push({
      $facet: {
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: safeOffset }, // ✅ تم إصلاحها
          { $limit: safeLimit }, // ✅ تم إصلاحها
          {
            $project: {
              _id: 1,
              orderNumber: 1,
              price: 1,
              status: 1,
              priority: 1,
              clientStage: 1,
              orderDate: 1,
              notes: 1,
              createdAt: 1,
              'user._id': 1,
              'user.fullName': 1,
              'user.email': 1,
              'user.phone': 1,
              'user.loyaltyPoints': 1,
              'user.loyaltyPointsLevel': 1,
              'service._id': 1,
              'service.title': 1,
              'service.description': 1,
              'service.price': 1,
              'service.image': 1,
            },
          },
        ],
        totalCount: [{ $count: 'count' }],
      },
    });

    const result = await this.orderModel.aggregate(pipeline).exec();
    const data = result[0]?.data || [];
    const total = result[0]?.totalCount?.[0]?.count || 0;

    return { data, total };
  }

  // 📌 تحديث حالة مستند واحد + كتابة ملاحظات
  async updateDocumentStatus(
    orderId: string,
    documentId: string,
    status: 'pending' | 'approved' | 'rejected' | 'needUpdate',
    notes?: string,
  ): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new BadRequestException('الطلب غير موجود.');

    const documents = order.documentsUrl || [];
    const documentIndex = documents.findIndex((d) => d.id === documentId);

    if (documentIndex === -1) {
      throw new BadRequestException('المستند غير موجود في هذا الطلب.');
    }

    // ✅ تحديث حالة المستند المحدد
    documents[documentIndex].status = status;
    documents[documentIndex].date = new Date();
    if (notes) documents[documentIndex].notes = notes;

    // ✅ تحديث الطلب في قاعدة البيانات
    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(orderId, { documentsUrl: documents }, { new: true })
      .exec();

    // ✅ تسجيل النشاط
    await this.activityLogService.logActivity(
      updatedOrder.user,
      { ar: 'تحديث حالة المستند', en: 'Document Status Updated' },
      {
        ar: `تم تغيير حالة المستند "${documents[documentIndex].name}" إلى "${status}" في الطلب رقم ${updatedOrder.orderNumber}.`,
        en: `Document "${documents[documentIndex].name}" status changed to "${status}" in order ${updatedOrder.orderNumber}.`,
      },
      {
        orderId: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        documentId,
        newStatus: status,
      },
    );

    return updatedOrder;
  }
}
