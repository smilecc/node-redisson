import { ICommandExecutor } from '../contracts/ICommandExecutor';
import { TimeUnit } from '../utils/TimeUnit';
import { RedissionBaseLock } from './RedissionBaseLock';

export class RedissionLock extends RedissionBaseLock {
  constructor(commandExecutor: ICommandExecutor, lockName: string) {
    super(commandExecutor, lockName);
  }

  async tryLock(waitTime: bigint, leaseTime: bigint, unit: TimeUnit): Promise<boolean> {
    let time = unit.toMillis(waitTime);
    let current = TimeUnit.now();

    const clientId = '';
    const ttl = await this.tryAcquire({ waitTime, leaseTime, unit, clientId });

    time -= TimeUnit.now() - current;

    if (time <= 0) {
      return false;
    }

    current = TimeUnit.now();

    return true;
  }

  private async tryAcquire(options: { waitTime?: bigint; leaseTime: bigint; unit: TimeUnit; clientId: string }) {
    const { waitTime, leaseTime, unit, clientId } = options;

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
      if (leaseTime > 0) {
        this.internalLockLeaseTime = unit.toMillis(leaseTime);
      } else {
        await this.scheduleExpirationRenewal(clientId);
      }
    }

    return ttlRemaining;
  }

  private async tryLockInner(options: { waitTime?: bigint; leaseTime: bigint; unit: TimeUnit; clientId: string }) {
    return this.commandExecutor.redis.rTryLockInner(
      // TODO: lockName
      '',
      options.unit.toMillis(options.leaseTime),
      options.clientId,
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
}
