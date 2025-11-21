import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Blog } from 'src/schemas/blog.schema';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { FindAllQuery } from 'src/interfaces/FindAllQuery';

interface TransformedCreateBlogData
  extends Omit<CreateBlogDto, 'categoryId' | 'createdBy' | 'tags'> {
  categoryId: Types.ObjectId;
  createdBy: Types.ObjectId;
  tags: Types.ObjectId[];
}

interface FindAllBlogsResult {
  total: number;
  data: any[];
}

@Injectable()
export class BloguserDashboardService {
  constructor(@InjectModel(Blog.name) private blogModel: Model<Blog>) {}

  async create(data: TransformedCreateBlogData): Promise<Blog> {
    return this.blogModel.create(data);
  }

  async findAll({
    limit,
    offset,
    search,
  }: FindAllQuery) {
    const matchQuery: any = {};
    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      matchQuery.$or = [{ title: regex }, { content: regex }];
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
          from: 'users',
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
          title: 1,
          description: 1,
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

    const [blogs, totalCount] = await Promise.all([
      this.blogModel.aggregate(aggregationPipeline).exec(),
      this.blogModel.countDocuments(matchQuery).exec(),
    ]);

    return {
      total: totalCount,
      data: blogs,
    };
  }

  async findById(id: string): Promise<Blog> {
    const blog = await this.blogModel
      .findById(id)
      .populate('createdBy')
      .populate('categoryId')
      .populate('tags');
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }

  async update(blogId: string, data: UpdateBlogDto): Promise<Blog> {
    const blog = await this.blogModel.findByIdAndUpdate(blogId, data, {
      new: true,
    });
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }

  async delete(id: string): Promise<Blog> {
    const blog = await this.blogModel.findByIdAndDelete(id);
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }
}