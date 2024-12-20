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

NodeRedisson 的基本使用非常简单。

```ts
import { Redisson } from 'node-redisson';

// 1. 创建Redisson实例
const redisson = new Redisson({
  redis: {
    options: {
      host: '127.0.0.1',
      port: 42800,
    },
  },
});

// 2. 获取锁
const lock = redisson.getLock('Example:LockName');

// 3. 加锁
await lock.lock();

// 4. 解锁
await lock.unlock();
```
