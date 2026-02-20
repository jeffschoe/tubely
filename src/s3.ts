import type { ApiConfig } from "./config";

export async function uploadVideoToS3(
  cfg: ApiConfig,
  key: string,
  processesFilePath: string,
  contentType: string,
  ) {
    const s3file = cfg.s3Client.file(key, { bucket: cfg.s3Bucket });
    const videoFile = Bun.file(processesFilePath);
    await s3file.write(videoFile, { type: contentType });
  }

export async function generatePresignedURL(
  cfg: ApiConfig, 
  key: string, 
  expireTime: number
) {
  const presignedUrl = cfg.s3Client.presign(key, {
    expiresIn: expireTime, // in seconds
  });

  return presignedUrl;
}