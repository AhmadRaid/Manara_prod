import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from 'src/schemas/chat.schema';
import { Message, MessageSchema } from 'src/schemas/message.schema';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Order, OrderSchema } from 'src/schemas/order.schema';
import { Service, ServiceSchema } from 'src/schemas/service.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  providers: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
