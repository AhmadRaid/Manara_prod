import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Chat', required: true })
  chat: Types.ObjectId;

  @Prop({ type: Types.ObjectId, refPath: 'senderType', required: true })
  sender: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['User', 'Provider'],
    required: true,
  })
  senderType: 'User' | 'Provider';

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop({ type: String, enum: ['text', 'file'], default: 'text' })
  messageType: 'text' | 'file';

  @Prop({ type: String, default: null })
  fileUrl?: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
