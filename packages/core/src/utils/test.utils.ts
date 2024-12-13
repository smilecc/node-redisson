import { RedisContainer } from '@testcontainers/redis';

export function createTestRedisContainer() {
  return new RedisContainer('redis:7.4.1-alpine').start();
}

export const TestRedisContainer = createTestRedisContainer();
export const TestTimeout = 30000;
