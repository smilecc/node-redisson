---
outline: deep
---

# 总览

## 接口

一般情况下锁都会实现如下接口，如有特殊情况将在对应的锁文档中说明。

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

## 说明

下面对接口内的成员做简要说明，详细文档请看对应锁的文档。

- `IRLock.clientId`：客户端 ID
- `IRLock.tryLock()`: 尝试加锁
- `IRLock.lock()`: 加锁，与 `tryLock` 的区别是 `lock` 将会持续等待到加锁成功。
- `IRLock.unlock()`：解锁
- `IRLock.forceUnlock()`：强制解锁，忽略锁持有状态
- `IRLock.isLocked()`：获取锁状态
