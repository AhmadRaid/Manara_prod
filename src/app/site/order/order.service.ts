import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Order } from 'src/schemas/order.schema';
import { Service } from 'src/schemas/service.schema';
import { CreateOrderStep1Dto } from './dto/create-order-step1.dto';
import { UpdateOrderPaymentDto } from './dto/update-order-payment.dto';
import { ActivityLogUserService } from '../../userDashboard/activity-log/activity-log.service';
import { PointsHistory } from 'src/schemas/pointsHistory.schema';
import { User } from 'src/schemas/user.schema';

interface Counter {
  _id: string;
  seq: number;
}

type DualLang = { ar: string; en: string };

@Injectable()
export class OrderSiteService {
  private readonly TIMELINE_STEPS = {
    STEP_CREATED: 'تم انشاء الطلب',
    STEP_PAYMENT: 'تم الدفع بنجاح',
    STEP_DOCUMENTS: 'رفع المستندات',
    STEP_PROCESSING: 'قيد المعالجة',
    STEP_FINAL_PROCESS: 'المعالجة النهائية',
  };

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Service.name) private serviceModel: Model<Service>,
    private readonly activityLogService: ActivityLogUserService,
    @InjectConnection() private readonly connection: Connection, // 👈 لإدارة الترانزاكشن
    @InjectModel('PointsHistory')
    private readonly pointsHistoryModel: Model<PointsHistory>,
    @InjectModel(User.name) private readonly userModel: Model<User>, // ✅ أضف @InjectModel
  ) {}

  async createOrderStep1(
    dto: CreateOrderStep1Dto,
    userId: string,
  ): Promise<Order> {
    const session = await this.orderModel.db.startSession();
    session.startTransaction();

    try {
      const service = await this.serviceModel
        .findById(dto.serviceId)
        .session(session);
      if (!service) throw new NotFoundException('الخدمة المطلوبة غير متوفرة.');

      // 🔹 الحصول على آخر رقم طلب وزيادته
      const counterResult = await this.orderModel.db
        .collection('counters')
        .findOneAndUpdate(
          { name: 'orderNumber' },
          { $inc: { value: 1 } },
          { upsert: true, returnDocument: 'after', session },
        );

      // إذا كان أول إدخال، خذ القيمة الافتراضية
      const nextOrderNumber = counterResult.value ? counterResult.value : 1;

      // 🔹 إنشاء الطلب
      const newOrder = await this.orderModel.create(
        [
          {
            user: new Types.ObjectId(userId),
            service: new Types.ObjectId(dto.serviceId),
            price: service.price,
            notes: dto.notes,
            status: 'waiting',
            clientStage: 'step1_review',
            orderNumber: `ORD-${nextOrderNumber}`,
            timeline: [
              {
                step: this.TIMELINE_STEPS.STEP_CREATED,
                done: true,
                date: new Date(),
                notes: 'تم إستلام طلبك و إنشاء رقم التتبع',
              },
              {
                step: this.TIMELINE_STEPS.STEP_PAYMENT,
                done: false,
                notes: ` ${service.price}تم إستلام مبلغ بقيمة`,
              },
              {
                step: this.TIMELINE_STEPS.STEP_DOCUMENTS,
                done: false,
                notes: 'تم رفع جميع المستندات المطلوبة',
              },
              {
                step: this.TIMELINE_STEPS.STEP_PROCESSING,
                done: false,
                notes: 'جار معالجة المستندات والتحقق منها',
              },
              {
                step: this.TIMELINE_STEPS.STEP_FINAL_PROCESS,
                done: false,
                notes: 'سيتم معالجة الطلب وإرسال النتائج',
              },
            ],
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      const createdOrder = newOrder[0];

      // 🔹 تسجيل النشاط بعد نجاح العملية
      await this.activityLogService.logActivity(
        createdOrder.user,
        { ar: 'طلب جديد', en: 'New Order Created' },
        {
          ar: `تم إنشاء طلب جديد للخدمة: ${service.title.ar}. رقم الطلب: ${createdOrder.orderNumber}.`,
          en: `New order created for service: ${service.title.en}. Order number: ${createdOrder.orderNumber}.`,
        },
        {
          orderId: createdOrder._id,
          orderNumber: createdOrder.orderNumber,
          status: createdOrder.status,
        },
      );

      // 🔹 إضافة معرف الطلب إلى مصفوفة orders في المستخدم
      await this.userModel.findByIdAndUpdate(
        userId,
        { $push: { order: createdOrder._id } },
        { new: true }, // لإرجاع المستخدم بعد التحديث إذا احتجت
      );

      return createdOrder;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // 💰 الخطوة 2: إتمام الدفع
  async updateOrderStep2Payment(
    orderId: string,
    dto: UpdateOrderPaymentDto,
    userId: string,
  ): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException('الطلب غير موجود.');
    if (!['step1_review', 'step2_payment'].includes(order.clientStage)) {
      throw new BadRequestException('لا يمكن إتمام الدفع في هذه المرحلة.');
    }

    const updatedTimeline = (order.timeline || []).map((item) =>
      item.step === this.TIMELINE_STEPS.STEP_PAYMENT
        ? {
            ...item,
            done: true,
            date: new Date(),
            notes: `تم الدفع بنجاح عبر ${dto.paymentMethod}.`,
          }
        : item,
    );

    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(
        orderId,
        {
          clientStage: 'step2_payment',
          status: 'in-progress',
          paymentMethod: dto.paymentMethod,
          timeline: updatedTimeline,
        },
        { new: true },
      )
      .exec();

    const service = await this.serviceModel
      .findById(updatedOrder.service)
      .exec();

    await this.activityLogService.logActivity(
      updatedOrder.user,
      { ar: 'تأكيد الدفع', en: 'Payment Confirmed' },
      {
        ar: `تم تأكيد دفعة الطلب ${updatedOrder.orderNumber} (${service?.title?.ar || 'الخدمة'})`,
        en: `Payment confirmed for order ${updatedOrder.orderNumber} (${service?.title?.en || 'Service'})`,
      },
      {
        orderId: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        paymentMethod: dto.paymentMethod,
      },
    );

    // 🔹 منح نقاط للمستخدم عند إنشاء الطلب
    const earnedPoints = Math.floor(service.price * 0.05); // مثال: 5% من سعر الخدمة

    if (earnedPoints > 0) {
      await this.pointsHistoryModel.create({
        user: new Types.ObjectId(userId),
        type: 'earn',
        points: earnedPoints,
        source: 'إنشاء طلب جديد',
        serviceId: service._id,
      });

      // يمكنك أيضًا تسجيلها في سجل النشاط
      await this.activityLogService.logActivity(
        updatedOrder.user,
        { ar: 'كسب نقاط', en: 'Points Earned' },
        {
          ar: `تم كسب ${earnedPoints} نقطة عند إنشاء الطلب رقم ${updatedOrder.orderNumber}.`,
          en: `${earnedPoints} points earned for creating order ${updatedOrder.orderNumber}.`,
        },
        {
          orderId: updatedOrder._id,
          orderNumber: updatedOrder.orderNumber,
          paymentMethod: dto.paymentMethod,
        },
      );
    }

    return updatedOrder;
  }

  async updateOrderStep3Documents(
    orderId: string,
    newDocuments: {
      id: string;
      url: string;
      status: string;
      date: Date;
      name: string;
    }[],
  ): Promise<Order> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException('الطلب غير موجود.');
    if (
      order.clientStage !== 'step2_payment' &&
      order.clientStage !== 'step3_documents'
    ) {
      throw new BadRequestException('لا يمكن رفع المستندات قبل الدفع.');
    }

    // ✅ المستندات القديمة
    const existingDocs = order.documentsUrl || [];

    const filteredDocs = existingDocs.filter(
      (oldDoc) =>
        !newDocuments.some(
          (newDoc) => newDoc.name === oldDoc.name || newDoc.id === oldDoc.id,
        ),
    );

    // ✅ دمج المستندات القديمة (بعد الفلترة) مع الجديدة
    const mergedDocuments = [...filteredDocs, ...newDocuments];

    // ✅ تحديث الجدول الزمني
    const updatedTimeline = (order.timeline || []).map((item) =>
      item.step === 'رفع المستندات'
        ? {
            ...item,
            done: true,
            date: new Date(),
            notes: `تم رفع ${newDocuments.length} مستند (بعضها قد تم تحديثه).`,
          }
        : item,
    );

    // ✅ تحديث الطلب
    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(
        orderId,
        {
          clientStage: 'step3_documents',
          documentsUrl: mergedDocuments,
          timeline: updatedTimeline,
        },
        { new: true },
      )
      .exec();

    // ✅ تسجيل النشاط
    await this.activityLogService.logActivity(
      updatedOrder.user,
      { ar: 'رفع المستندات', en: 'Documents Uploaded' },
      {
        ar: `تم رفع أو تحديث ${newDocuments.length} مستند للطلب رقم ${updatedOrder.orderNumber}.`,
        en: `${newDocuments.length} documents uploaded or updated for order ${updatedOrder.orderNumber}.`,
      },
      {
        orderId: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        documentCount: newDocuments.length,
      },
    );

    return updatedOrder;
  }

  // 🗑️ حذف الطلب بدون التأثير على تسلسل رقم الطلب
  async deleteOrder(orderId: string, userId: string): Promise<void> {
    const order = await this.orderModel.findById(orderId).exec();

    if (!order) throw new NotFoundException('الطلب غير موجود.');

    if (order.user.toString() !== userId.toString()) {
      throw new BadRequestException('لا يمكنك حذف طلب لا تملكه.');
    }

    await this.orderModel.deleteOne({ _id: orderId }).exec();

    const title: DualLang = { ar: 'تم حذف الطلب', en: 'Order Deleted' };
    const description: DualLang = {
      ar: `تم حذف الطلب رقم ${order.orderNumber} بنجاح.`,
      en: `Order ${order.orderNumber} was deleted successfully.`,
    };

    await this.activityLogService.logActivity(order.user, title, description, {
      orderId: order._id,
      orderNumber: order.orderNumber,
    });
  }

  // 📄 جلب جميع المستندات الخاصة بطلب معين
  async getOrderDocuments(orderId: string): Promise<
    {
      id: string;
      name: string;
      url: string;
      status: string;
      date: Date;
      notes?: string;
    }[]
  > {
    const order = await this.orderModel
      .findById(orderId)
      .select('documentsUrl orderNumber user') // فقط الحقول المطلوبة
      .exec();

    if (!order) throw new NotFoundException('الطلب غير موجود.');

    // ✅ تسجيل عملية القراءة (اختياري)
    await this.activityLogService.logActivity(
      order.user,
      { ar: 'عرض المستندات', en: 'View Documents' },
      {
        ar: `تم عرض المستندات الخاصة بالطلب رقم ${order.orderNumber}.`,
        en: `Documents viewed for order ${order.orderNumber}.`,
      },
      {
        orderId: order._id,
        orderNumber: order.orderNumber,
        documentCount: order.documentsUrl.length,
      },
    );

    return order.documentsUrl || [];
  }
}
