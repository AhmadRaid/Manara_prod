import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

// Define the schema for the multilingual field
const MultilingualSchema = {
  en: { type: String, required: true },
  ar: { type: String, required: true },
};

@Schema({ timestamps: true })
export class Blog {
  @Prop({ type: MultilingualSchema, required: true })
  title: { en: string; ar: string };

  @Prop({ type: MultilingualSchema, required: true })
  description: { en: string; ar: string };

  @Prop({ type: MultilingualSchema, required: true })
  content: { en: string; ar: string };

  @Prop({ type: String })
  image: string;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Category',
  })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Admin', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Tag' }], default: [],required: true })
  tags: Types.ObjectId[];

  @Prop({ type: String,required: true })
  estimateReadTime: string;

  @Prop({ type: Boolean, default: false })
  feature: boolean;

  @Prop({ type: Number, default: 0 })
  countRead: number;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
