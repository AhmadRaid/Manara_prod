import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProviderService } from './provider.service';
import { Provider, ProviderSchema } from 'src/schemas/serviceProvider.schema';
import { ProviderController } from './provider.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Provider.name, schema: ProviderSchema }]),
  ],
  providers: [ProviderService],
  controllers: [ProviderController],
})
export class ProviderModule {}
