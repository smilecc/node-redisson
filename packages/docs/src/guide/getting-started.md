# Quick Start

## Installation

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

## Usage

The basic usage of NodeRedisson is very easy.

```ts
import { Redisson } from 'node-redisson';

// 1. Create a Redisson instance
const redisson = new Redisson({
  redis: {
    options: {
      host: '127.0.0.1',
      port: 42800,
    },
  },
});

// 2. Get the lock
const lock = redisson.getLock('Example:LockName');

// 3. Lock
await lock.lock();

// 4. Unlock
await lock.unlock();
```
