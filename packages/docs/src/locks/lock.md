---
outline: deep
---

# Lock (Reentrant Lock)

The Lock (Reentrant Lock) is the most basic type of lock provided in NodeRedisson and also the most commonly used one. It allows you to repeatedly acquire the lock within the same asynchronous context.

## Quick Start

```ts
import { Redisson } from 'node-redisson';

const redisson = new Redisson({
  redis: {
    options: {
      host: '127.0.0.1',
      port: 42800,
    },
  },
});

// Get a lock
const lock = redisson.getLock('Example:ReentrantLock');

// Acquire the lock
await lock.lock();

// Release the lock
await lock.unlock();
```

## Features

### Reentrancy

In multi-threaded scenarios, a reentrant lock refers to a type of lock that can be repeatedly acquired by the current thread. In NodeRedisson, it allows you to repeatedly acquire the lock within the same asynchronous context.

Usually, whether a thread can acquire a lock is related to its thread ID. However, as we all know, Node.js is asynchronous and single-threaded. So, NodeRedisson will identify whether it is in the same context through the `clientId` parameter.

When creating an instance of the lock, you can choose to pass in the `clientId` parameter. When passed in, the value of this parameter will be used; when not passed in, `crypto.randomUUID` will be automatically used to create a globally unique ID.

```ts
const lock1 = redisson.getLock('Example:ReentrantLock');
// Acquire the lock for the first time
await lock1.lock();

const lock2 = redisson.getLock('Example:ReentrantLock', lock1.clientId);
// ✔️ Can acquire the lock
await lock2.lock();

const lock3 = redisson.getLock('Example:ReentrantLock');
// ❌ The lock is waiting and cannot be acquired temporarily because the lock has been acquired by other clients
await lock2.lock();
```

### Final Release

The reentrant lock can be locked multiple times when the `clientId` is the same. Meanwhile, the corresponding number of unlock operations are required for the lock to be finally released.

That is to say, if a lock has been locked 3 times, then 3 unlock operations are also needed for the lock to be finally released.

```ts
const lock = redisson.getLock('Example:ReentrantLock');
await lock.lock();
await lock.lock();

await lock.unlock();
// true
console.log(await lock.isLocked());

await lock.unlock();
// false
console.log(await lock.isLocked());
```

## API

### Redisson.tryLock()

- Signature: `tryLock(waitTime, leaseTime, unit): Promise<boolean>;`

It attempts to acquire the lock. You can set the maximum waiting time. If the lock has not been acquired within the specified time, the lock acquisition fails and `false` is returned; otherwise, `true` is returned.

```ts
await lock.tryLock(5, 10, TimeUnit.SECONDS);
```

#### waitTime

- Function: It is the maximum waiting time for the lock. If the waiting exceeds this time, the lock waiting will be automatically exited and `false` will be returned.
- Type: `number | bigint | false`
  - Any number greater than 0: It represents the maximum waiting time for the lock.
  - `0`: Try to acquire the lock once. If the lock acquisition fails, return directly without waiting.
  - `false`: Ignore the waiting time and keep waiting until the lock is successfully acquired.

#### leaseTime

- Function: It is the time for holding the lock.
- Type: `number | bigint | true`
  - Any number greater than 0: It represents the time for holding the lock. The lock will be automatically released when the time is exceeded.
  - `true` or `0`: The time for holding the lock will be automatically renewed until the lock is actively released.

#### unit

- Function: It is used to determine the time units of `waitTime` and `leaseTime`.
- Type: `TimeUnit`
- Default value: `TimeUnit.MILLISECONDS`

The following types are available for selection:

```ts
TimeUnit.MILLISECONDS;
TimeUnit.SECONDS;
TimeUnit.MINUTES;
TimeUnit.HOURS;
TimeUnit.DAYS;
```

### Redisson.lock()

- Signature: `lock(leaseTime, unit): Promise<void>`

It acquires the lock. The difference from `tryLock` is that `lock` will keep waiting until the lock is successfully acquired.

```ts
await lock.lock();
await lock.lock(5000);
await lock.lock(5, TimeUnit.SECONDS);
```

#### leaseTime

- Default value: `true`

Others are the same as the `leaseTime` of `tryLock`.

#### unit

- Default value: `TimeUnit.MILLISECONDS`

Others are the same as the `unit` of `tryLock`.
