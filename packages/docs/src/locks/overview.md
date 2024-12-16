---
outline: deep
---

# Overview

## Interfaces

Under normal circumstances, locks will implement the following interfaces. If there are special circumstances, it will be explained in the corresponding lock documentation.

```ts
export interface IRLock {
  get clientId(): LockClientId;

  tryLock(waitTime: RLockWaitTime, leaseTime: RLockLeaseTime, unit: TimeUnit): Promise<boolean>;

  lock(): Promise<void>;
  lock(leaseTime: RLockLeaseTime): Promise<void>;
  lock(leaseTime: RLockLeaseTime, unit: TimeUnit): Promise<void>;

  unlock(): Promise<void>;

  forceUnlock(): Promise<boolean>;

  isLocked(): Promise<boolean>;
}
```

## Explanation

The following gives a brief explanation of the members within the interface. For detailed documentation, please refer to the documentation of the corresponding lock.

- `IRLock.clientId`: Client ID.
- `IRLock.tryLock()`: Try to acquire the lock.
- `IRLock.lock()`: Acquire the lock. The difference from `tryLock` is that `lock` will keep waiting until the lock is successfully acquired.
- `IRLock.unlock()`: Release the lock.
- `IRLock.forceUnlock()`: Forcefully release the lock, ignoring the lock holding status.
- `IRLock.isLocked()`: Get the lock status.
