import { TimeUnit } from '../utils/TimeUnit';

export interface IRLock {
  tryLock(waitTime: bigint | false, leaseTime: bigint, unit: TimeUnit): Promise<boolean>;

  lock(leaseTime?: bigint, unit?: TimeUnit): Promise<void>;

  unlock(): Promise<void>;

  forceUnlock(): Promise<boolean>;

  isLocked(): Promise<boolean>;
}
