import { CreateMultipartUploadCommand, S3Client, UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

const s3Client = new S3Client()

export const handler = async (event) => {
  const { filename, totalChunks } = JSON.parse(event.body);
  const bucket = 'mpu-class';
  const filekey = `${randomUUID()}-${filename}`;
  const createMPUCommand = new CreateMultipartUploadCommand({
    Bucket: bucket,
    Key: filekey,
  });
  const { UploadId } = await s3Client.send(createMPUCommand);
  if (!UploadId) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create MPU' }),
    };
  }
  const signedUrlPromises = [];
  for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
    const uploadPartCommand = new UploadPartCommand({
      Bucket: bucket,
      Key: filekey,
      UploadId,
      PartNumber: 1,
    });
    signedUrlPromises.push(
      getSignedUrl(
        s3Client,
        uploadPartCommand,
        { expiresIn: 3600 },
      )
    );
  }
  const parts = await Promise.all(signedUrlPromises);
  return {
    statusCode: 201,
    body: JSON.stringify({
      uploadId: UploadId,
      key,
      parts: parts.map((part, index) => ({
        partNumber: index + 1,
        url: part,
      })),
    }),
  };
}