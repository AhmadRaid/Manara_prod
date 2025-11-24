import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UpdateServiceDto } from './dto/update-service.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { generateUploadConfig } from 'src/config/upload.file.config';
import { ServiceUserDashboardService } from './service.service';
import { JwtAuthGuard } from 'src/common/guards/jwtAuthGuard';

@Controller('userDashboard/services')
@UseGuards(JwtAuthGuard)

export class ServiceUserDashboardController {
  constructor(private readonly serviceService: ServiceUserDashboardService) {}

  // @UseInterceptors(FileInterceptor('image', generateUploadConfig('services')))
  // @Post()
  // create(
  //   @Body() createServiceDto: any,
  //   @UploadedFile() image: Express.Multer.File,
  // ) {
  //   return this.serviceService.create(createServiceDto, image);
  // }

@Get()
  findAll(
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @Query('search') search: string,
  ) {
    // تحويل limit و offset إلى أرقام (Numbers) قبل إرسالها للخدمة
    const queryParams = {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      search: search,
    };
    
    return this.serviceService.findAll(queryParams);
  }

  @Get('stats')
  getServiceStats() {
    return this.serviceService.getServiceStats();
  }

  @Get(':serviceId')
  findById(@Param('id') id: string) {
    return this.serviceService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateServiceDto) {
    return this.serviceService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.serviceService.delete(id);
  }
}
