import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Blog } from 'src/schemas/blog.schema';
import { FindAllQuery } from 'src/interfaces/FindAllQuery';
import { CreateBlogDto } from './dto/create-blog.dto';

interface TransformedCreateBlogData
  extends Omit<CreateBlogDto, 'categoryId' | 'createdBy' | 'tags'> {
  // Title and Description are now objects in the DTO, so we don't need to omit/change them
  categoryId: Types.ObjectId;
  createdBy: Types.ObjectId;
  tags: Types.ObjectId[];
}

@Injectable()
export class BlogAdminService {
  constructor(@InjectModel(Blog.name) private blogModel: Model<Blog>) {}

  async create(
    createBlogDto: CreateBlogDto,
    userId: string,
    image: Express.Multer.File,
  ): Promise<Blog> {
    const transformedTags = createBlogDto.tags.map(
      (id) => new Types.ObjectId(id as any),
    );
    const blogData = {
      ...createBlogDto,
      createdBy: new Types.ObjectId(userId),
      categoryId: new Types.ObjectId(createBlogDto.categoryId as any),
      tags: transformedTags,
      image: image
        ? `https://backend-uh6k.onrender.com/${image.path}`
        : createBlogDto.image || null,
    };

    const createdBlog = new this.blogModel(blogData);
    return createdBlog.save();
  }

  async findAll({ limit, offset, search }: FindAllQuery, lang: string) {
    const matchQuery: any = {};
    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      // Updated search to target multilingual fields
      matchQuery.$or = [
        { 'title.en': regex },
        { 'title.ar': regex },
        { 'description.en': regex },
        { 'description.ar': regex },
      ];
    }

    const aggregationPipeline: any[] = [
      ...(Object.keys(matchQuery).length > 0 ? [{ $match: matchQuery }] : []),

      { $sort: { createdAt: -1 } },

      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'admins',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creatorInfo',
        },
      },
      { $unwind: { path: '$creatorInfo', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'tags',
          localField: 'tags',
          foreignField: '_id',
          as: 'tagsInfo',
        },
      },

      { $skip: offset || 0 },
      { $limit: limit || 10 },

      {
        $project: {
          _id: 1,
          title: {
            $ifNull: [`$title.${lang}`, `$title.ar`],
          },
          // 🆕 ترجمة حقل الوصف
          description: {
            $ifNull: [`$description.${lang}`, `$description.ar`],
          },
          content: {
            $ifNull: [`$description.${lang}`, `$description.ar`],
          },
          image: 1,
          estimateReadTime: 1,
          feature: 1,
          countRead: 1,
          createdAt: 1,
          updatedAt: 1,
          isDeleted: 1,

          category: {
            _id: '$categoryInfo._id',
            name: '$categoryInfo.name',
            slug: '$categoryInfo.slug',
          },
          createdBy: {
            _id: '$creatorInfo._id',
            name: '$creatorInfo.fullName',
            email: '$creatorInfo.email',
          },
          tags: '$tagsInfo',
        },
      },
    ];

    const [blogs, totalCount] = await Promise.all([
      this.blogModel.aggregate(aggregationPipeline).exec(),
      this.blogModel.countDocuments(matchQuery).exec(),
    ]);

    return {
      total: totalCount,
      data: blogs,
    };
  }

  async findById(id: string, lang: string): Promise<any> {
    const aggregationPipeline: any[] = [
      { $match: { _id: new Types.ObjectId(id), isDeleted: false } },

      // الربط مع الفئة (category)
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },

      // الربط مع المستخدم المنشئ (createdBy)
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creatorInfo',
        },
      },
      { $unwind: { path: '$creatorInfo', preserveNullAndEmptyArrays: true } },

      // الربط مع الوسوم (tags)
      {
        $lookup: {
          from: 'tags',
          localField: 'tags',
          foreignField: '_id',
          as: 'tagsInfo',
        },
      },

      // Project مع دعم اللغات
      {
        $project: {
          _id: 1,
          title: { $ifNull: [`$title.${lang}`, `$title.ar`] },
          description: { $ifNull: [`$description.${lang}`, `$description.ar`] },
          content: { $ifNull: [`$content.${lang}`, `$content.ar`] },
          image: 1,
          estimateReadTime: 1,
          feature: 1,
          countRead: 1,
          createdAt: 1,
          updatedAt: 1,
          category: {
            _id: '$categoryInfo._id',
            name: '$categoryInfo.name',
            slug: '$categoryInfo.slug',
          },
          createdBy: {
            _id: '$creatorInfo._id',
            name: '$creatorInfo.name',
            email: '$creatorInfo.email',
          },
          tags: '$tagsInfo',
        },
      },
    ];

    const result = await this.blogModel.aggregate(aggregationPipeline).exec();

    if (!result || result.length === 0) {
      throw new NotFoundException('Blog not found');
    }

    return result[0];
  }

  async update(
    blogId: string,
    updateBlogDto: any,
    userId: string,
    image?: Express.Multer.File,
  ): Promise<Blog> {
    const blog = await this.blogModel.findById(blogId);
    if (!blog) throw new NotFoundException('Blog not found');

    // 🧠 معالجة الـ tags مثل create()
    const transformedTags = updateBlogDto.tags
      ? updateBlogDto.tags.map((id) => new Types.ObjectId(id))
      : blog.tags;

    // 🧠 معالجة الصورة (إذا تم رفع صورة جديدة)
    const imageUrl = image
      ? `https://backend-uh6k.onrender.com/${image.path}`
      : updateBlogDto.image || blog.image;

    // 🧠 تجهيز بيانات التحديث كما في create()
    const updatedData = {
      ...updateBlogDto,
      createdBy: new Types.ObjectId(userId),
      categoryId: updateBlogDto.categoryId
        ? new Types.ObjectId(updateBlogDto.categoryId)
        : blog.categoryId,
      tags: transformedTags,
      image: imageUrl,
    };

    // 🧱 تنفيذ التحديث
    const updatedBlog = await this.blogModel.findByIdAndUpdate(
      blogId,
      updatedData,
      {
        new: true,
      },
    );

    return updatedBlog;
  }

  async delete(id: string): Promise<Blog> {
    const blog = await this.blogModel.findByIdAndUpdate(id, {
      isDeleted: true,
    });
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }
}
