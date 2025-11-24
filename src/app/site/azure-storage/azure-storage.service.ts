// src/common/azure-storage/azure-storage.service.ts (أو المسار الخاص بك)

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  // لا نحتاج لـ getContainerClient هنا
} from '@azure/storage-blob';

@Injectable()
export class AzureStorageService {
  private containerName: string;
  private blobServiceClient: BlobServiceClient;
  private accountName: string;

  constructor(private configService: ConfigService) {
    // قراءة متغيرات البيئة من ملف .env
    const connectionString = this.configService.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );
    this.containerName =
      this.configService.get<string>('AZURE_STORAGE_CONTAINER_NAME') ||
      'uploads';

    if (!connectionString) {
      throw new InternalServerErrorException(
        'AZURE_STORAGE_CONNECTION_STRING is not set.',
      );
    }

    try {
      this.blobServiceClient =
        BlobServiceClient.fromConnectionString(connectionString);
      // استخراج اسم الحساب من سلسلة الاتصال
      this.accountName =
        connectionString.match(/AccountName=([^;]+)/)?.[1] || '';
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to connect to Azure Storage.',
      );
    }
  }

  /**
   * دالة لرفع ملف Buffer إلى Azure Blob Storage
   * @param fileBuffer - بيانات الملف بصيغة Buffer
   * @param originalName - اسم الملف الأصلي (للحصول على الامتداد)
   * @param mimeType - نوع الملف (Content Type)
   * @returns URL الخاص بالملف المرفوع مع توقيع SAS
   */
  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<string> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );

    // إنشاء اسم ملف فريد
    const blobName = `${Date.now()}-${originalName.replace(/\s/g, '_')}`;

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    try {
      await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
        blobHTTPHeaders: {
          blobContentType: mimeType,
          // 💡 الحل لعرض الملف بدلاً من تنزيله
          blobContentDisposition: 'inline',
        },
      });

      // توليد رابط SAS لأن الحاوية Private
      return this.generateSasUrl(blobName);
    } catch (error) {
      console.error('Failed to upload file to Azure:', error.message);
      throw new InternalServerErrorException('Failed to upload file.');
    }
  }

  /**
   * دالة لتوليد رابط Shared Access Signature (SAS) للملف
   */
  private generateSasUrl(blobName: string): string {
    const connectionString = this.configService.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );
    const accountKey = connectionString.match(/AccountKey=([^;]+)/)?.[1];

    if (!accountKey) {
      throw new InternalServerErrorException(
        'Azure Storage Account Key not found.',
      );
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(
      this.accountName,
      accountKey,
    );

    const sasOptions = {
      containerName: this.containerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'), // 'r' تعني Read (قراءة)
      startsOn: new Date(),
      expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // ينتهي بعد ساعة
    };

    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      sharedKeyCredential,
    ).toString();

    // بناء الرابط النهائي
    return `https://${this.accountName}.blob.core.windows.net/${this.containerName}/${blobName}?${sasToken}`;
  }
}
