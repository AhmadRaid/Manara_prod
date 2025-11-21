import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpStatus,
  HttpCode,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagAdminService } from './tag.service';
import { JwtAuthAdminGuard } from 'src/common/guards/jwtAuthAdminGuard';

@Controller('admin/tags')
@UseGuards(JwtAuthAdminGuard)
export class TagAdminController {
  constructor(private readonly tagAdminService: TagAdminService) {}

  @Post()
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagAdminService.create(createTagDto);
  }

  @Get()
  findAll(
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @Query('lang') lang: string,
  ) {
        const queryParams = {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };
    return this.tagAdminService.findAll(queryParams,lang);
  }

  @Get(':tagId')
  findById(@Param('tagId') tagId: string,    @Query('lang') lang: string,
) {
    return this.tagAdminService.findById(tagId,lang);
  }

  @Patch(':tagId')
  update(@Param('tagId') tagId: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagAdminService.update(tagId, updateTagDto);
  }

  @Delete(':tagId')
  delete(@Param('tagId') tagId: string) {
    return this.tagAdminService.delete(tagId);
  }
}
