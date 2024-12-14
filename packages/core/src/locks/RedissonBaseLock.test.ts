import Redis from 'ioredis';
import { Redisson } from '../Redisson';
import { TestRedisOptions, TestTimeout } from '../test.config';
import { randomUUID } from 'crypto';
import { ExpirationEntry, RedissonBaseLock } from './RedissonBaseLock';

describe('RedissonBaseLock', () => {
  jest.setTimeout(TestTimeout);

  let redisson: Redisson;

  beforeAll(async () => {
    redisson = new Redisson({
      redis: {
        options: {
          ...(await TestRedisOptions),
          enableReadyCheck: true,
        },
      },
    });

    // Wait redis connected
    const redis = redisson['commandExecutor'].redis;
    await new Promise((r) => (redis as Redis).once('ready', r));
  });

  afterAll(async () => {
    await redisson['commandExecutor'].redis.quit();
  });

  it('get name', () => {
    const lockName = randomUUID();
    const lock = redisson.getLock(lockName) as RedissonBaseLock;

    expect(lock.name).toBe(lock['lockName']);
  });
});

describe('ExpirationEntry', () => {
  jest.setTimeout(TestTimeout);

  it('add client and remove client', () => {
    const randomClientId = randomUUID();
    const randomClientId2 = randomUUID();
    const entry = new ExpirationEntry();

    expect(entry.hasNoClients).toBeTruthy();
    expect(entry.firstClientId).toBeUndefined();

    // Add clientId1, counter should eq 1
    entry.addClientId(randomClientId);
    expect(entry.getClientCounter(randomClientId)).toBe(1);

    // Add clientId1 again, counter should eq 2
    entry.addClientId(randomClientId);
    expect(entry.getClientCounter(randomClientId)).toBe(2);

    expect(entry.hasNoClients).toBeFalsy();
    expect(entry.firstClientId).toBe(randomClientId);

    // Add clientId2, counter should eq 1
    entry.addClientId(randomClientId2);
    expect(entry.getClientCounter(randomClientId2)).toBe(1);

    expect(entry.hasNoClients).toBeFalsy();
    expect(entry.firstClientId).toBe(randomClientId);

    // Remove clientId1, counter should eq 1
    entry.removeClientId(randomClientId);
    expect(entry.firstClientId).toBe(randomClientId);
    expect(entry.getClientCounter(randomClientId)).toBe(1);

    // Remove clientId1 again, firstClient eq clientId2
    entry.removeClientId(randomClientId);

    expect(entry.hasNoClients).toBeFalsy();
    expect(entry.firstClientId).toBe(randomClientId2);

    // Remove clientId2
    entry.removeClientId(randomClientId2);

    expect(entry.hasNoClients).toBeTruthy();
    expect(entry.firstClientId).toBeUndefined();
  });
});
