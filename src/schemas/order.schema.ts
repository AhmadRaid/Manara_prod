import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Connection } from 'mongoose';
import * as mongooseSequence from 'mongoose-sequence';

// ---------------------------------------------------------
// شكل عناصر الجدول الزمني
// ---------------------------------------------------------
export interface OrderTimeline {
  step: string;
  date?: Date;
  notes?: string;
  done: boolean;
}

export interface OrderDocument {
  id: string;
  name: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected' | 'needUpdate';
  date: Date;
  notes?: string;
}

// ---------------------------------------------------------
// القالب الافتراضي للحالات الخمس
// ---------------------------------------------------------
const createDefaultTimeline = (): OrderTimeline[] => [
  {
    step: 'تم انشاء الطلب',
    done: true,
    date: new Date(),
    notes: 'تم استلام طلبك وانشاء رقم التتبع',
  },
  {
    step: 'تم الدفع بنجاح',
    done: false,
    notes: 'تم استلام دفعة',
  },
  {
    step: 'رفع المستندات',
    done: false,
    notes: 'تم رفع جميع المستندات المطلوبة',
  },
  {
    step: 'قيد المعالجة',
    done: false,
    notes: 'جار معالجة المستندات والتحقق منها',
  },
  {
    step: 'المعالجة النهائية',
    done: false,
    notes: 'سيتم معالجة الطلب والتحقق من النتائج.',
  },
];

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Service', required: true })
  service: Types.ObjectId; // لا تضع unique هنا لأن الـ plugin يضيفه تلقائيًا

  @Prop({ type: String, unique: true, index: true })
  orderNumber: string;

  @Prop({ required: true })
  price: number;

  @Prop({
    required: true,
    enum: ['in-progress', 'waiting', 'done'],
    default: 'waiting',
  })
  status: string;

  @Prop({ type: Boolean, default: false })
  priority: boolean;

  @Prop({
    required: true,
    enum: ['step1_review', 'step2_payment', 'step3_documents', 'complete'],
    default: 'step1_review',
  })
  clientStage: string;

  @Prop({ type: [Object], default: createDefaultTimeline })
  timeline: OrderTimeline[];

  @Prop({ default: Date.now })
  orderDate: Date;

  @Prop({
    type: [
      {
        id: { type: String, required: true },
        url: { type: String, required: true },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected', 'needUpdate'],
          default: 'pending',
        },
        date: { type: Date, default: Date.now },
        name: { type: String, required: true },
        notes: { type: String, default: '' }, // 👈 تمت الإضافة هنا
      },
    ],
    default: [],
  })
  documentsUrl: OrderDocument[];

  @Prop()
  notes: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// ---------------------------------------------------------
// دالة لتطبيق الـ AutoIncrement Plugin
// ---------------------------------------------------------
export function applyAutoIncrement(connection: Connection) {
  const AutoIncrement = mongooseSequence(connection);
  OrderSchema.plugin(AutoIncrement, {
    id: 'order_number_seq',
    inc_field: 'orderNumber',
    start_seq: 1100,
    prefix: '#ORD-',
  });
  return OrderSchema;
}
