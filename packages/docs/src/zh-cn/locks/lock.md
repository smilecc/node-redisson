---
outline: deep
---

# Lock（可重入锁）

Lock（可重入锁）是 NodeRedisson 中提供的最基本的一种锁，也是最常用的锁，允许你在同一异步上下文中重复获取锁。

## 快速上手

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

// 创建锁
const lock = redisson.getLock('Example:ReentrantLock');

// 获取锁
await lock.lock();

// 释放锁
await lock.unlock();
```

## 特点

### 可重入

在多线程中，可重入锁指的是可以被当前线程重复获取的一类锁，而在 NodeRedisson 中，将允许你在同一异步上下文中重复获取锁。

通常，一个线程能否获取锁与它的线程 ID 有关，但众所周知 Node.js 是异步单线程的，所以 NodeRedisson 会通过 `clientId` 参数来识别是否处于同一上下文。

在创建锁的实例时，您可以选择传入 `clientId` 参数，当传入时，会采用该参数的值；当不传入时，则会自动使用 `crypto.randomUUID` 来创建一个全局唯一 ID。

```ts
const lock1 = redisson.getLock('Example:ReentrantLock');
// 首次加锁
await lock1.lock();

const lock2 = redisson.getLock('Example:ReentrantLock', lock1.clientId);
// ✔️ 可获取锁
await lock2.lock();

const lock3 = redisson.getLock('Example:ReentrantLock');
// ❌ 锁等待，暂无法获取锁，因为锁已被其他客户端获取
await lock2.lock();
```

### 最终释放

可重入锁在 `clientId` 相同时可以被多次加锁，与此同时，解锁也需要进行对应次数解锁，才会最终释放。

也就是说，如果一把锁被加锁了 3 次，那么同样需要 3 次解锁，该锁才会最终释放。

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

- 签名：`tryLock(waitTime, leaseTime, unit): Promise<boolean>;`

尝试加锁，可以设定最大等待时间，如果超出时间还没获取到锁，则加锁失败返回 `false`，否则返回 `true`。

```ts
await lock.tryLock(5, 10, TimeUnit.SECONDS);
```

#### waitTime

- 作用：锁最大等待时间，等待超出该时间则自动退出锁等待，并返回 `false`
- 类型：`number | bigint | false`
  - 任意大于 0 的数字：锁最大等待时间
  - `0`：尝试一次加锁，加锁失败时直接返回不等待
  - `false`：忽略等待时间，一直等待到加锁成功

#### leaseTime

- 作用：持有锁时间
- 类型：`number | bigint | true`
  - 任意大于 0 的数字：持有锁时间，超出时间将会自动释放锁
  - `true` 或 `0`：持有锁时间自动续期，一直到主动释放锁

#### unit

- 作用：确定 `waitTime` 和 `leaseTime` 的时间单位
- 类型：`TimeUnit`
- 默认值：`TimeUnit.MILLISECONDS`

有以下几种类型可选：

```ts
TimeUnit.MILLISECONDS;
TimeUnit.SECONDS;
TimeUnit.MINUTES;
TimeUnit.HOURS;
TimeUnit.DAYS;
```

### Redisson.lock()

- 签名：`lock(leaseTime, unit): Promise<void>`

加锁，与 `tryLock` 的区别是 `lock` 将会持续等待到加锁成功。

```ts
await lock.lock();
await lock.lock(5000);
await lock.lock(5, TimeUnit.SECONDS);
```

#### leaseTime

- 默认值：`true`

其他与 `tryLock` 的 `leaseTime` 相同。

#### unit

- 默认值：`TimeUnit.MILLISECONDS`

其他与 `tryLock` 的 `unit` 相同。
