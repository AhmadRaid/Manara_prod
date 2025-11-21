import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Define the schema for the multilingual field
const MultilingualSchema = {
  en: { type: String, required: true },
  ar: { type: String, required: true },
};

// تعريف النوع لـ TypeScript
export type CategoryDocument = Category & Document;

/**
 * @description
 * يمثل هذا المخطط نموذج فئة (Category) لتصنيف المدونات أو الخدمات.
 */
@Schema({ timestamps: true }) // إضافة حقول createdAt و updatedAt تلقائيًا
export class Category {
  // اسم الفئة أصبح كائنًا متعدد اللغات
  @Prop({ required: true, unique: true, type: MultilingualSchema })
  name: { en: string; ar: string };

  @Prop({ unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: MultilingualSchema })
  description: { en: string; ar: string };

  @Prop({ type: String, default: null })
  imageUrl: string | null;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    const nameToSlugify = this.name['en'] || this.name['ar'] || '';
    this.slug = nameToSlugify
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-');
  }
  next();
});
