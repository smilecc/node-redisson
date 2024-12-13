import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { Redisson } from '../Redisson';
import { TestRedisContainer, TestTimeout } from '../utils/test.utils';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { RedissonLock } from './RedissonLock';
import { TimeUnit } from '../utils/TimeUnit';

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

  afterAll(async () => {
    await redisson['commandExecutor'].redis.quit();
  });

  it('should connected', async () => {
    const redis = redisson['commandExecutor'].redis;
    const randomKey = randomUUID();
    const randomValue = randomUUID();

    await expect(redis.set(randomKey, randomValue)).resolves.toBe('OK');
    await expect(redis.get(randomKey)).resolves.toBe(randomValue);
  });

  it.only('should be acquire lock', async () => {
    const lockName = randomUUID();
    const lock = redisson.getLock(lockName) as RedissonLock;
    const lock2 = redisson.getLock(lockName) as RedissonLock;

    // test acquire lock
    await expect(lock.isLocked()).resolves.toBeFalsy();
    await lock['tryAcquire']({ leaseTime: 2n, unit: TimeUnit.SECONDS, clientId: lock['clientId'] });
    await expect(lock.isLocked()).resolves.toBeTruthy();

    // test reentrant lock
    await expect(
      lock['tryAcquire']({ leaseTime: 2n, unit: TimeUnit.SECONDS, clientId: lock['clientId'] }),
    ).resolves.toBeNull();

    // get ttl
    const ttlRemaining = await lock2['tryAcquire']({
      leaseTime: 1n,
      unit: TimeUnit.SECONDS,
      clientId: lock2['clientId'],
    });

    expect(typeof ttlRemaining).toBe('number');

    // test lock timeout
    await new Promise((r) => setTimeout(r, ttlRemaining!));
    await expect(lock.isLocked()).resolves.toBeFalsy();
  });
});
