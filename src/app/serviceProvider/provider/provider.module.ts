import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProviderService } from 'src/app/serviceProvider/provider/provider.service';
import { Provider, ProviderSchema } from 'src/schemas/serviceProvider.schema';
import { ProviderController } from 'src/app/serviceProvider/provider/provider.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Provider.name, schema: ProviderSchema }]),
  ],
  providers: [ProviderService],
  controllers: [ProviderController],
})
export class ProviderModule {}
