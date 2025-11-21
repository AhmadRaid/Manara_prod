import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';

export class CreateMessageDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly receiverId: string; // ID المستخدم المستقبل

  @IsString()
  @IsNotEmpty()
  readonly content: string; // محتوى الرسالة
}