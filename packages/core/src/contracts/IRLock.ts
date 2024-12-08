import { TimeUnit } from '../utils/TimeUnit';

export interface IRLock {
  lockInterruptibly(leaseTime: bigint, unit: TimeUnit): Promise<void>;

  tryLock(waitTime: bigint, leaseTime: bigint, unit: TimeUnit): Promise<boolean>;

  lock(leaseTime: bigint, unit: TimeUnit): Promise<void>;

  forceUnlock(): Promise<boolean>;

  isLocked(): Promise<boolean>;
}
