import { RedisContainer } from '@testcontainers/redis';

const useLocalRedis = false;

export const TestTimeout = 60_000;
export type JestRedisOptions = {
  host: string;
  port: number;
  password?: string;
};

export async function createTestRedisContainer(): Promise<JestRedisOptions> {
  if (useLocalRedis) {
    return {
      host: '127.0.0.1',
      port: 42800,
    };
  } else {
    const container = await new RedisContainer('redis:7.4.1-alpine').start();
    return {
      host: container.getHost(),
      port: container.getPort(),
      password: container.getPassword(),
    };
  }
}

export const TestRedisOptions = createTestRedisContainer();
