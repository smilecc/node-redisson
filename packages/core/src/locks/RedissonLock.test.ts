import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { Redisson } from '../Redisson';
import { TestRedisContainer, TestTimeout } from '../utils/test.utils';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

describe('RedissonLock', () => {
  jest.setTimeout(TestTimeout);

  let redisContainer: StartedRedisContainer;
  let redisson: Redisson;

  beforeAll(async () => {
    redisContainer = await TestRedisContainer;

    redisson = new Redisson({
      redis: {
        options: {
          host: redisContainer.getHost(),
          port: redisContainer.getPort(),
          password: redisContainer.getPassword(),
          enableReadyCheck: true,
        },
      },
    });

    // wait redis connected
    const redis = redisson['commandExecutor'].redis;
    await new Promise((r) => (redis as Redis).once('ready', r));
  });

  it('should connected', async () => {
    const redis = redisson['commandExecutor'].redis;
    const randomKey = randomUUID();
    const randomValue = randomUUID();

    await expect(redis.set(randomKey, randomValue)).resolves.toBe('OK');
    await expect(redis.get(randomKey)).resolves.toBe(randomValue);
  });

  // it('', async () => {
  //   const randomLock = randomUUID();
  //   const lock = redisson.getLock(randomLock);
  // });
});
