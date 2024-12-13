import { ICommandExecutor, SYMBOL_TIMEOUT } from '../contracts/ICommandExecutor';
import { TimeUnit } from '../utils/TimeUnit';
import { RedissonBaseLock } from './RedissonBaseLock';

export class RedissonLock extends RedissonBaseLock {
  constructor(commandExecutor: ICommandExecutor, lockName: string) {
    super(commandExecutor, lockName);
  }

  async tryLock(waitTime: bigint, leaseTime: bigint, unit: TimeUnit): Promise<boolean> {
    let time = unit.toMillis(waitTime);
    let current = TimeUnit.now();

    const clientId = '';
    const ttl = await this.tryAcquire({ waitTime, leaseTime, unit, clientId });

    // lock acquired
    if (ttl === null) {
      return true;
    }

    const timeover = () => {
      // calc wait time
      time -= TimeUnit.now() - current;

      // time over, get lock fail
      return time <= 0;
    };

    // wait lock
    while (true) {
      if (timeover()) return false;

      const ttl = await this.tryAcquire({ waitTime, leaseTime, unit, clientId });
      // lock acquired
      if (ttl === null) {
        return true;
      }

      if (timeover()) return false;

      // waiting for message
      const _waitTime = ttl >= 0 && ttl < time ? ttl : time;
      const waitResult = await this.commandExecutor.waitSubscribeOnce<never>(this.getChannelName(), Number(_waitTime));

      if (waitResult === SYMBOL_TIMEOUT) {
        return false;
      }
    }
  }

  private async tryAcquire(options: { waitTime?: bigint; leaseTime: bigint; unit: TimeUnit; clientId: string }) {
    const { waitTime, leaseTime, unit, clientId } = options;

    /**
     * ttlRemaining == null -> lock acquired
     * ttlRemaining is a number -> the lock remaining time
     */
    const ttlRemaining = await this.tryLockInner(
      leaseTime > 0
        ? {
            waitTime,
            leaseTime,
            unit,
            clientId,
          }
        : {
            waitTime,
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

  private async tryLockInner(options: { waitTime?: bigint; leaseTime: bigint; unit: TimeUnit; clientId: string }) {
    return this.commandExecutor.redis.rTryLockInner(
      this.lockName,
      options.unit.toMillis(options.leaseTime),
      this.getClientName(options.clientId),
    );
  }

  lockInterruptibly(leaseTime: bigint, unit: TimeUnit): Promise<void> {
    throw new Error('Method not implemented.');
  }

  lock(leaseTime: bigint, unit: TimeUnit): Promise<void> {
    throw new Error('Method not implemented.');
  }

  forceUnlock(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  isLocked(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  getChannelName() {
    return RedissonBaseLock.prefixName('redisson:lock_channel', this.lockName);
  }
}