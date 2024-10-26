import { CompleteMultipartUploadCommand, S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client()

export const handler = async (event) => { 
  const { filekey, uploadId, parts } = JSON.parse(event.body);
  const command = new CompleteMultipartUploadCommand({
    Bucket: 'mpu-class',
    Key: filekey,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts.map(part => (({
        PartNumber: part.partNumber,
        Etag: part.entityTag
      })))
    }
  });
  await s3Client.send(command);
}