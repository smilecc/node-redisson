# Node Redisson

> English | [中文](https://github.com/smilecc/node-redisson/blob/main/README_cn.md)

Node Redisson is a Redis distributed lock for Node.js, which is easy to use and highly available.

It refers to the distributed lock implementation of Java Redisson and can be mutually compatible with the locks of Java Redisson.

## Why Node Redisson

Usually, Node.js developers will use [Node Redlock](https://github.com/mike-marcacci/node-redlock) as a distributed lock, but it seems that this project is no longer maintained.

Moreover, `node-redlock` project is not very easy to use. When using it, you need to pay great attention to the holding time of the lock, make predictions about the holding time of the lock in advance, and manually renew the lock. However, in actual business development, it is very difficult to make efficient predictions about the holding time of the lock.

`Node Redisson` has implemented the "watchdog" and "lock release notification" features, so that you don't have to worry about predicting the holding time of the lock anymore.

Of course, you can also manually set the duration of the lock.

## Environmental Dependencies

- Node.js >= 16
- Redis >= 3 (when using PubSub as the message implementation)

The Redis version is relevant to the message implementation. When using Pub/Sub by default, the Redis version should be >= 3, and when using Streams, the Redis version needs to be >= 5.

## Quickstart

### Install

```sh
pnpm add node-redisson ioredis
```

### Usage
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

// create a lock
const lock = redisson.getLock('Example:FirstLock');

// acquire lock
await lock.lock();

// free the lock
await lock.unlock();
```

## Document 🚧

Documentation is in progress.
