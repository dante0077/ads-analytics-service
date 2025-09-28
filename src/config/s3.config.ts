export class S3Config {
  static getRegion(): string {
    return process.env.AWS_REGION || 'us-east-1';
  }

  static getBucketName(): string {
    return process.env.AWS_S3_BUCKET_NAME || 'ads-analytics-renders';
  }

  static getAccessKeyId(): string {
    return process.env.AWS_ACCESS_KEY_ID || '';
  }

  static getSecretAccessKey(): string {
    return process.env.AWS_SECRET_ACCESS_KEY || '';
  }

  static getS3Config() {
    return {
      region: this.getRegion(),
      credentials: {
        accessKeyId: this.getAccessKeyId(),
        secretAccessKey: this.getSecretAccessKey(),
      },
    };
  }
}
