// @flow

export interface S3Config {
  bucket: string;
  keyPrefix: string;
  endpoint?: string;
  region?: string;
  s3ForcePathStyle?: boolean;
  accessKeyId?: string;
  secretAccessKey?: string;
}
