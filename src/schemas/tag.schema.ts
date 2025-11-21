import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TagDocument = Tag & Document;

// 🆕 تعريف واجهة التخزين متعددة اللغات
class I18n {
  @Prop({ type: String, required: true })
  ar: string;

  @Prop({ type: String, required: true })
  en: string;
}

@Schema({ timestamps: true })
export class Tag {
  // 🆕 حقل Name أصبح متعدد اللغات
  @Prop({ type: I18n, required: true })
  name: I18n;

  @Prop({
    type: I18n,
    default: {
      ar: 'علامة لتصنيف المحتوى.',
      en: 'A label for content classification.',
    },
  })
  description: I18n;

  @Prop({
    type: Number,
    default: 0,
  })
  blogsCount: Number;

  @Prop({
    type: Boolean,
    default: false,
  })
  isDeleted: Boolean;
}

export const TagSchema = SchemaFactory.createForClass(Tag);

// تحديث الـ pre-save hook لإنشاء الـ slug من الاسم العربي
// TagSchema.pre('save', function (next) {
//   // 🆕 نستخدم الاسم العربي لإنشاء الـ slug الافتراضي
//   if (this.isModified('name') || this.isNew) {
//     if (this.name && this.name.ar) {
//         // يسمح بالأحرف العربية في الـ slug
//         this.slug = this.name.ar
//           .toLowerCase()
//           .replace(/\s+/g, '-')
//           .replace(/[^a-z0-9-ء-ي]/g, '');
//     }
//   }
//   next();
// });
