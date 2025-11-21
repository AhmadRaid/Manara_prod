import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Chat', required: true })
  chat: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  sender: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, enum: ['User', 'Provider'], required: true })
  senderType: 'User' | 'Provider';

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  receiver: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ default: false })
  isRead: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
