import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

export class FileUploadUtil {
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  /**
   * Validate uploaded file
   */
  static validateFile(file: Express.Multer.File): void {
    if (!file) {
      return; // File is optional
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check file type
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }
  }

  /**
   * Generate unique filename
   */
  static generateFileName(originalName: string, prefix: string = ''): string {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(originalName);
    // Simple, clean filename without original name
    return `${prefix}${uniqueSuffix}${ext}`;
  }

  /**
   * Ensure upload directory exists
   */
  static ensureUploadDir(dirPath: string): void {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Get file path relative to uploads directory
   */
  static getRelativePath(fileName: string, subDir: string = ''): string {
    return subDir ? `${subDir}/${fileName}` : fileName;
  }
}

