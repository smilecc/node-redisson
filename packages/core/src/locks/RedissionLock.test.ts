import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { Redission } from '../Redisson';
import { TestRedisContainer, TestTimeout } from '../utils/test.utils';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

describe('RedissionLock', () => {
  jest.setTimeout(TestTimeout);

  let redisContainer: StartedRedisContainer;
  let redission: Redission;

  beforeAll(async () => {
    redisContainer = await TestRedisContainer;

    redission = new Redission({
      redis: {
        options: {
          host: redisContainer.getHost(),
          port: redisContainer.getPort(),
          password: redisContainer.getPassword(),
        },
      },
    });

    // wait redis connected
    const redis = redission['commandExecutor'].redis;
    await new Promise((r) => (redis as Redis).once('ready', r));
  });

  it('should connected', async () => {
    const redis = redission['commandExecutor'].redis;
    const randomKey = randomUUID();
    const randomValue = randomUUID();

    await expect(redis.set(randomKey, randomValue)).resolves.toBe('OK');
    await expect(redis.get(randomKey)).resolves.toBe(randomValue);
  });
});
