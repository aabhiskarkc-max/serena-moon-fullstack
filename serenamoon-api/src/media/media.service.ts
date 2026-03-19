import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

export type MediaUploadResult = {
  url: string;
  provider: 'cloudinary';
  publicId: string;
};

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  private get isConfigured() {
    return (
      !!process.env.CLOUDINARY_CLOUD_NAME &&
      !!process.env.CLOUDINARY_API_KEY &&
      !!process.env.CLOUDINARY_API_SECRET
    );
  }

  async uploadImage(
    fileBuffer: Buffer,
    folder: string,
  ): Promise<MediaUploadResult> {
    if (!this.isConfigured) {
      this.logger.error('Media upload attempted but Cloudinary is not configured.');
      throw new InternalServerErrorException(
        'Media upload service is not configured. Please contact the administrator.',
      );
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException('No file provided for upload');
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    try {
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder,
              resource_type: 'image',
            },
            (error, uploadResult) => {
              if (error || !uploadResult) {
                return reject(error ?? new Error('Upload failed'));
              }
              resolve(uploadResult);
            },
          )
          .end(fileBuffer);
      });

      return {
        url: result.secure_url,
        provider: 'cloudinary',
        publicId: result.public_id,
      };
    } catch (err) {
      this.logger.error('Cloudinary upload failed', err as Error);
      throw new InternalServerErrorException('Failed to upload media');
    }
  }

  async uploadMedia(
    fileBuffer: Buffer,
    folder: string,
    resourceType: 'image' | 'video' = 'image',
  ): Promise<MediaUploadResult> {
    if (!this.isConfigured) {
      this.logger.error('Media upload attempted but Cloudinary is not configured.');
      throw new InternalServerErrorException(
        'Media upload service is not configured. Please contact the administrator.',
      );
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException('No file provided for upload');
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    try {
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder,
              resource_type: resourceType,
            },
            (error, uploadResult) => {
              if (error || !uploadResult) {
                return reject(error ?? new Error('Upload failed'));
              }
              resolve(uploadResult);
            },
          )
          .end(fileBuffer);
      });

      return {
        url: result.secure_url,
        provider: 'cloudinary',
        publicId: result.public_id,
      };
    } catch (err) {
      this.logger.error('Cloudinary upload failed', err as Error);
      throw new InternalServerErrorException('Failed to upload media');
    }
  }
}

