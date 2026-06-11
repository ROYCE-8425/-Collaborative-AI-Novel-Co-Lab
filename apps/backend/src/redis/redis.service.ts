import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  onModuleInit() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  getClient(): Redis {
    return this.client;
  }

  async setTimer(roomId: string, seconds: number): Promise<void> {
    await this.client.set(`room:${roomId}:timer`, seconds.toString(), 'EX', seconds);
  }

  async getTimer(roomId: string): Promise<number> {
    const ttl = await this.client.ttl(`room:${roomId}:timer`);
    return ttl < 0 ? 0 : ttl;
  }

  async setVoteLock(key: string, ttlSeconds: number = 3600): Promise<boolean> {
    const result = await this.client.set(key, 'voted', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async acquireLock(roomId: string, ttlMs: number): Promise<boolean> {
    const lockKey = `lock:room:${roomId}:turn`;
    const result = await this.client.set(lockKey, 'locked', 'PX', ttlMs, 'NX');
    return result === 'OK';
  }

  async releaseLock(roomId: string): Promise<void> {
    const lockKey = `lock:room:${roomId}:turn`;
    await this.client.del(lockKey);
  }

  async addPresence(roomId: string, userId: string, displayName: string, socketId: string): Promise<void> {
    const data = JSON.stringify({ userId, displayName, socketId });
    await this.client.hset(`room:${roomId}:presence`, userId, data);
  }

  async removePresence(roomId: string, userId: string, socketId?: string): Promise<void> {
    if (socketId) {
      const existing = await this.client.hget(`room:${roomId}:presence`, userId);
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          if (parsed.socketId !== socketId) {
            // A newer connection exists for this user, do not remove.
            return;
          }
        } catch {
          // Proceed to remove if parse fails
        }
      }
    }
    await this.client.hdel(`room:${roomId}:presence`, userId);
  }

  async getPresence(roomId: string): Promise<any[]> {
    const raw = await this.client.hgetall(`room:${roomId}:presence`);
    if (!raw) return [];
    return Object.values(raw).map((val) => {
      try {
        return JSON.parse(val);
      } catch {
        return { userId: '', displayName: 'Guest Writer', socketId: val };
      }
    });
  }
}
