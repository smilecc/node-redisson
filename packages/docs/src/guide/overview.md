# What is NodeRedisson

Node Redisson is a Redis distributed lock for Node.js, which is easy to use and highly available.

It refers to the distributed lock implementation of Java Redisson and can be mutually compatible with the locks of Java Redisson.

## Why Node Redisson

Usually, Node.js developers will use [Node Redlock](https://github.com/mike-marcacci/node-redlock) as a distributed lock, but it seems that this project is no longer maintained.

Moreover, `node-redlock` project is not very easy to use. When using it, you need to pay great attention to the holding time of the lock, make predictions about the holding time of the lock in advance, and manually renew the lock. However, in actual business development, it is very difficult to make efficient predictions about the holding time of the lock.

`Node Redisson` has implemented the **watchdog** and **unlock notification** features, so that you don't have to worry about predicting the holding time of the lock anymore.

Of course, you can also manually set the duration of the lock.

## Environmental Dependencies

- Node.js >= 16
- Redis >= 3 (when using PubSub as the message implementation)

::: info
The Redis version is relevant to the message implementation. When using Pub/Sub by default, the Redis version should be >= 3, and when using Streams, the Redis version needs to be >= 5.
:::

## Thanks

Thank you for using it. If you like this project, please give it a star on [Github](https://github.com/smilecc/node-redisson). Thank you.
