export class AppConfig {
  static getPort(): number {
    return Number(process.env.PORT || 3000);
  }

  static getNodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }

  static isProduction(): boolean {
    return this.getNodeEnv() === 'production';
  }

  static isDevelopment(): boolean {
    return this.getNodeEnv() === 'development';
  }
}
