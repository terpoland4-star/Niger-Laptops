import { Client } from 'minio';
import { env } from '../config/env';
import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';

class UploadService {
  private client: Client;
  private bucket: string;
  private initialized: boolean = false;

  constructor() {
    this.bucket = env.MINIO_BUCKET;
    this.client = new Client({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: false,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const bucketExists = await this.client.bucketExists(this.bucket);
      if (!bucketExists) {
        await this.client.makeBucket(this.bucket, 'us-east-1');
        console.log(`✅ Bucket "${this.bucket}" créé`);

        // Politique publique pour les images produits
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        };
        await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy));
      }
      this.initialized = true;
      console.log('✅ MinIO connecté');
    } catch (error) {
      console.error('❌ Erreur connexion MinIO:', error);
      throw error;
    }
  }

  // Upload d'une image produit avec redimensionnement
  async uploadProductImage(
    buffer: Buffer,
    originalName: string,
    productId: string
  ): Promise<{ url: string; thumbnail: string; key: string }> {
    await this.initialize();

    const ext = path.extname(originalName).toLowerCase() || '.jpg';
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    const key = `products/${productId}/${timestamp}-${random}${ext}`;
    const thumbKey = `products/${productId}/${timestamp}-${random}-thumb${ext}`;

    // Image principale (max 1200px)
    const mainImage = await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Thumbnail (300px)
    const thumbImage = await sharp(buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toBuffer();

    // Uploader les deux versions
    await Promise.all([
      this.client.putObject(this.bucket, key, mainImage, mainImage.length, {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
      }),
      this.client.putObject(this.bucket, thumbKey, thumbImage, thumbImage.length, {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
      }),
    ]);

    const baseUrl = env.IS_DEV
      ? `http://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${this.bucket}`
      : `https://cdn.nigerlaptops.ne`;

    return {
      url: `${baseUrl}/${key}`,
      thumbnail: `${baseUrl}/${thumbKey}`,
      key: key,
    };
  }

  // Upload d'une bannière
  async uploadBanner(
    buffer: Buffer,
    originalName: string
  ): Promise<{ url: string; key: string }> {
    await this.initialize();

    const ext = path.extname(originalName).toLowerCase() || '.jpg';
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    const key = `banners/${timestamp}-${random}${ext}`;

    const image = await sharp(buffer)
      .resize(1920, 600, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer();

    await this.client.putObject(this.bucket, key, image, image.length, {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000',
    });

    const baseUrl = env.IS_DEV
      ? `http://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${this.bucket}`
      : `https://cdn.nigerlaptops.ne`;

    return {
      url: `${baseUrl}/${key}`,
      key: key,
    };
  }

  // Supprimer un fichier
  async deleteFile(key: string): Promise<void> {
    await this.initialize();
    try {
      await this.client.removeObject(this.bucket, key);
    } catch (error) {
      console.warn(`⚠️ Impossible de supprimer ${key}:`, error);
    }
  }

  // Supprimer plusieurs fichiers
  async deleteFiles(keys: string[]): Promise<void> {
    await this.initialize();
    try {
      await this.client.removeObjects(this.bucket, keys);
    } catch (error) {
      console.warn('⚠️ Impossible de supprimer des fichiers:', error);
    }
  }

  // Obtenir l'URL publique d'un fichier
  getPublicUrl(key: string): string {
    const baseUrl = env.IS_DEV
      ? `http://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${this.bucket}`
      : `https://cdn.nigerlaptops.ne`;
    return `${baseUrl}/${key}`;
  }
}

export const uploadService = new UploadService();
