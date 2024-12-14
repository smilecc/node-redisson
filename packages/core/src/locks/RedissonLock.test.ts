import { Redisson } from '../Redisson';
import { TestRedisOptions, TestTimeout } from '../test-config';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { RedissonLock } from './RedissonLock';
import { TimeUnit } from '../utils/TimeUnit';
import { RedissonLockError } from '../errors/RedissonLockError';
import { UnlockMessages } from '../contracts/ICommandExecutor';

describe('RedissonLock', () => {
  jest.setTimeout(TestTimeout);

  let redisson: Redisson;

  beforeAll(async () => {
    redisson = new Redisson({
      lockWatchdogTimeout: 3000n,
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

  it('redis connected', async () => {
    const redis = redisson['commandExecutor'].redis;
    const randomKey = randomUUID();
    const randomValue = randomUUID();

    await expect(redis.set(randomKey, randomValue, 'EX', 10)).resolves.toBe('OK');
    await expect(redis.get(randomKey)).resolves.toBe(randomValue);
  });

  it('tryAcquire lock', async () => {
    const lockName = randomUUID();
    const lock = redisson.getLock(lockName) as RedissonLock;
    const lock2 = redisson.getLock(lockName) as RedissonLock;

    // Test acquire lock
    await expect(lock.isLocked()).resolves.toBeFalsy();
    await lock['tryAcquire']({ leaseTime: 2n, unit: TimeUnit.SECONDS, clientId: lock['clientId'] });
    await expect(lock.isLocked()).resolves.toBeTruthy();

    // Test reentrant lock
    await expect(
      lock['tryAcquire']({ leaseTime: 2n, unit: TimeUnit.SECONDS, clientId: lock['clientId'] }),
    ).resolves.toBeNull();

    // Get ttl
    const ttlRemaining = await lock2['tryAcquire']({
      leaseTime: 1n,
      unit: TimeUnit.SECONDS,
      clientId: lock2['clientId'],
    });

    expect(typeof ttlRemaining).toBe('number');

    // Test lock timeout
    await new Promise((r) => setTimeout(r, ttlRemaining!));
    await expect(lock.isLocked()).resolves.toBeFalsy();
  });

  it('lock and unlock', async () => {
    const lockName = randomUUID();
    const lock = redisson.getLock(lockName);
    const lock2 = redisson.getLock(lockName);

    // Before lock, all lock can't unlock
    expect(lock.unlock()).rejects.toThrow(RedissonLockError);
    expect(lock2.unlock()).rejects.toThrow(RedissonLockError);

    // All lock states should be unlocked
    await expect(lock.isLocked()).resolves.toBeFalsy();
    await expect(lock2.isLocked()).resolves.toBeFalsy();

    // No.1 lock
    await lock.lock();
    // No.2 lock
    await expect(lock.tryLock(1n, 0n, TimeUnit.SECONDS)).resolves.toBeTruthy();

    // Test another tryLock
    await expect(lock2.tryLock(1n, 0n, TimeUnit.SECONDS)).resolves.toBeFalsy();

    // All lock states should be locked
    await expect(lock.isLocked()).resolves.toBeTruthy();
    await expect(lock2.isLocked()).resolves.toBeTruthy();

    // No.1 unlock, All lock states should be locked
    await lock.unlock();
    await expect(lock.isLocked()).resolves.toBeTruthy();
    await expect(lock2.isLocked()).resolves.toBeTruthy();

    // After No.2 unlock, all lock states should be unlocked
    await lock.unlock();
    await expect(lock.isLocked()).resolves.toBeFalsy();
    await expect(lock2.isLocked()).resolves.toBeFalsy();

    // After unlock, all lock can't unlock again
    expect(lock.unlock()).rejects.toThrow(RedissonLockError);
    expect(lock2.unlock()).rejects.toThrow(RedissonLockError);
  });

  it('unlock event message', (done) => {
    const lockName = randomUUID();
    const lock = redisson.getLock(lockName) as RedissonLock;

    // Check unlock message by lock channel
    lock['commandExecutor'].subscribeOnce(lock['getChannelName'](), (v) => {
      expect(v).toBe(UnlockMessages.UNLOCK);
      done();
    });

    lock
      .lock()
      .then(async () => {
        await lock.unlock();
      })
      .catch((e) => done(e));
  });

  it('wait manual unlock and acquire lock', (done) => {
    const lockName = randomUUID();
    const lock = redisson.getLock(lockName) as RedissonLock;
    const lock2 = redisson.getLock(lockName) as RedissonLock;

    lock
      .lock()
      .then(async () => {
        lock2
          .tryLock(false, 10n, TimeUnit.SECONDS)
          .then((result) => {
            expect(result).toBeTruthy();
            done();
          })
          .catch((e) => done(e));

        await lock.unlock();
      })
      .catch((e) => done(e));
  });

  it('wait lease unlock and acquire lock', (done) => {
    const lockName = randomUUID();
    const lock = redisson.getLock(lockName) as RedissonLock;
    const lock2 = redisson.getLock(lockName) as RedissonLock;

    lock
      .tryLock(false, 2n, TimeUnit.SECONDS)
      .then(async () => {
        lock2
          .tryLock(false, 10n, TimeUnit.SECONDS)
          .then((result) => {
            expect(result).toBeTruthy();
            done();
          })
          .catch((e) => done(e));
      })
      .catch((e) => done(e));
  });

  it('wait lease unlock and lock fail', (done) => {
    const lockName = randomUUID();
    const lock = redisson.getLock(lockName) as RedissonLock;
    const lock2 = redisson.getLock(lockName) as RedissonLock;

    lock
      .tryLock(false, 10n, TimeUnit.SECONDS)
      .then(async () => {
        lock2
          .tryLock(1n, 10n, TimeUnit.SECONDS)
          .then((result) => {
            expect(result).toBeFalsy();
            done();
          })
          .catch((e) => done(e));
      })
      .catch((e) => done(e));
  });

  it('force unlock', async () => {
    const lockName = randomUUID();
    const lock = redisson.getLock(lockName) as RedissonLock;
    const lock2 = redisson.getLock(lockName) as RedissonLock;

    await lock.lock();

    expect(lock.isLocked()).resolves.toBeTruthy();
    expect(lock2.isLocked()).resolves.toBeTruthy();

    await lock2.forceUnlock();

    expect(lock.isLocked()).resolves.toBeFalsy();
    expect(lock2.isLocked()).resolves.toBeFalsy();

    await expect(lock2.tryLock(1n, 10n, TimeUnit.SECONDS)).resolves.toBeTruthy();
  });

  it.skip('test with java-redisson', async () => {
    const lock = redisson.getLock('SmileTest');

    const now = TimeUnit.now();

    await lock.lock();
    expect(lock.isLocked()).resolves.toBeTruthy();
    console.log('lock.lock', TimeUnit.now() - now);

    await new Promise((r) => setTimeout(r, 20_000));

    await lock.unlock();
  });
});
