import { ICommandExecutor, SYMBOL_TIMEOUT, UnlockMessages } from '../contracts/ICommandExecutor';
import { TimeUnit } from '../utils/TimeUnit';
import { LockClientId, RedissonBaseLock } from './RedissonBaseLock';

export class RedissonLock extends RedissonBaseLock {
  constructor(commandExecutor: ICommandExecutor, lockName: string) {
    super(commandExecutor, lockName);
  }

  async tryLock(waitTime: bigint | false, leaseTime: bigint, unit: TimeUnit): Promise<boolean> {
    const waitForever = waitTime === false;

    let time = unit.toMillis(waitForever ? 0 : waitTime);
    let current = TimeUnit.now();

    const clientId = this.clientId;
    const ttl = await this.tryAcquire({ leaseTime, unit, clientId });

    // lock acquired
    if (ttl === null) {
      return true;
    }

    const isTimeOver = () => {
      if (waitForever) return false;

      // calc wait time
      time -= TimeUnit.now() - current;

      // time over, get lock fail
      return time <= 0;
    };

    // wait lock
    while (true) {
      if (isTimeOver()) return false;

      const ttl = await this.tryAcquire({ leaseTime, unit, clientId });
      // lock acquired
      if (ttl === null) {
        return true;
      }

      if (isTimeOver()) return false;

      // waiting for message
      const _waitTime = waitForever || (ttl >= 0 && ttl < time) ? ttl : time;

      // console.log({ ttl, _waitTime });

      const waitResult = await this.commandExecutor.waitSubscribeOnce<never>(
        this.getChannelName(),
        // When waitting forever, ttl has a possibility eq 0.
        // So when _waitTime lte 0, set the timeout to 1000ms.
        Number(_waitTime > 0 ? _waitTime : 1000),
      );

      if (!waitForever && waitResult === SYMBOL_TIMEOUT) {
        return false;
      }
    }
  }

  private async tryAcquire(options: { leaseTime: bigint; unit: TimeUnit; clientId: string }) {
    const { leaseTime, unit, clientId } = options;

    /**
     * ttlRemaining == null -> lock acquired
     * ttlRemaining is a number -> the lock remaining time
     */
    const ttlRemaining = await this.tryLockInner(
      leaseTime > 0
        ? {
            leaseTime,
            unit,
            clientId,
          }
        : {
            leaseTime: this.internalLockLeaseTime,
            unit: TimeUnit.MILLISECONDS,
            clientId,
          },
    );

    if (ttlRemaining === null) {
      // lock acquired
      if (leaseTime > 0) {
        this.internalLockLeaseTime = unit.toMillis(leaseTime);
      } else {
        this.scheduleExpirationRenewal(clientId);
      }
    }

    return ttlRemaining;
  }

  private async tryLockInner(options: { leaseTime: bigint; unit: TimeUnit; clientId: string }) {
    return this.commandExecutor.redis.rTryLockInner(
      this.lockName,
      options.unit.toMillis(options.leaseTime),
      this.getClientName(options.clientId),
    );
  }

  async unlockInner(clientId: LockClientId, requestId: string, timeout: number) {
    const result = await this.commandExecutor.redis.rUnlockInner(
      this.lockName,
      this.getChannelName(),
      this.getUnlockLatchName(requestId),
      UnlockMessages.UNLOCK,
      this.internalLockLeaseTime,
      this.getClientName(clientId),
      timeout,
    );

    // console.log({ clientName: this.getClientName(clientId), result });

    if (result === null) {
      return null;
    }

    return !!result;
  }

  async lock(leaseTime: bigint = -1n, unit: TimeUnit = TimeUnit.MILLISECONDS): Promise<void> {
    await this.tryLock(false, leaseTime, unit);
  }

  async forceUnlock(): Promise<boolean> {
    const result = await this.commandExecutor.redis.rForceUnlock(
      this.lockName,
      this.getChannelName(),
      UnlockMessages.UNLOCK,
    );

    return !!result;
  }

  getChannelName() {
    return RedissonBaseLock.prefixName('redisson_lock__channel', this.lockName);
  }
}
