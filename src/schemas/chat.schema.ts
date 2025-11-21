import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Chat extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  user?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Provider', required: false })
  provider?: Types.ObjectId;

  @Prop({ type: String, default: '' })
  lastMessage: string;

  @Prop({ type: Date, default: Date.now })
  lastMessageAt: Date;

  @Prop({ default: false })
  hasUnreadMessagesForUser: boolean;

  @Prop({ default: false })
  hasUnreadMessagesForProvider: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

// ✅ منع تكرار نفس المحادثة لنفس الطلب
ChatSchema.index({ order: 1, user: 1, provider: 1 }, { unique: true });
