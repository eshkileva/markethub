import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { AppConfig } from '../../config/env.js';

export interface ObjectStorage {
  ensureBucket(): Promise<void>;
  putObject(key: string, body: Buffer, contentType: string): Promise<{ url: string; key: string }>;
}

export function createObjectStorage(config: AppConfig): ObjectStorage {
  const client = new S3Client({
    region: config.S3_REGION,
    endpoint: config.S3_ENDPOINT,
    forcePathStyle: config.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: config.S3_ACCESS_KEY,
      secretAccessKey: config.S3_SECRET_KEY,
    },
  });

  return {
    async ensureBucket() {
      try {
        await client.send(new HeadBucketCommand({ Bucket: config.S3_BUCKET }));
      } catch {
        await client.send(new CreateBucketCommand({ Bucket: config.S3_BUCKET }));
      }
    },
    async putObject(key, body, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: config.S3_BUCKET,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
      return {
        key,
        url: `${config.S3_PUBLIC_URL}/${key}`,
      };
    },
  };
}
