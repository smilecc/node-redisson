# 快速开始

## 安装

::: code-group

```sh [npm]
$ npm add node-redisson ioredis
```

```sh [pnpm]
$ pnpm add node-redisson ioredis
```

```sh [yarn]
$ yarn add node-redisson ioredis
```

:::

## 初次使用

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
const lock = redisson.getLock('Example:FirstLock');

// 获取锁
await lock.lock();

// 释放锁
await lock.unlock();
```
