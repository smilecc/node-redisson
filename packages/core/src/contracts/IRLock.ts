import { LockClientId } from '../locks/RedissonBaseLock';
import { RedissonTime, TimeUnit } from '../utils/TimeUnit';

export type RLockWaitTime = RedissonTime | false;
export type RLockLeaseTime = RedissonTime | true;

export interface IRLock {
  get clientId(): LockClientId;

  tryLock(waitTime: RLockWaitTime, leaseTime: RLockLeaseTime): Promise<boolean>;
  tryLock(waitTime: RLockWaitTime, leaseTime: RLockLeaseTime, unit: TimeUnit): Promise<boolean>;

  lock(): Promise<void>;
  lock(leaseTime: RLockLeaseTime): Promise<void>;
  lock(leaseTime: RLockLeaseTime, unit: TimeUnit): Promise<void>;

  unlock(): Promise<void>;

  forceUnlock(): Promise<boolean>;

  isLocked(): Promise<boolean>;
}
