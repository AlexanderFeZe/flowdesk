import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisBlacklistService implements OnModuleInit, OnModuleDestroy {
  private redisClient!: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // Connects seamlessly to your running Docker Redis instance
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);

    this.redisClient = new Redis({
      host,
      port,
      maxRetriesPerRequest: null,
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  /**
   * Adds a token signature to the database blacklist registry until its natural expiration.
   */
  async blacklistToken(token: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return;
    await this.redisClient.set(`blacklist:${token}`, 'true', 'EX', ttlSeconds);
  }

  /**
   * Asserts whether an incoming token signature has been previously invalidated.
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.redisClient.get(`blacklist:${token}`);
    return result === 'true';
  }
}