# 了解 NodeRedisson

NodeRedisson 是一个 Node.js 的 Redis 分布式锁，易于使用、高可用。

参考了 Java Redisson 的分布式锁实现，可以与 Java Redisson 的锁相互兼容。

## 为什么要开发 NodeRedisson

通常 Node.js 的开发者会使用 [Node Redlock](https://github.com/mike-marcacci/node-redlock) 作为分布式锁，但该项目似乎已经不再维护。

且该项目不是很容易使用，在使用 Node Redlock 时，您需要非常关注锁的持有时间，需要对锁的持有时间进行预判，并手动进行锁的续期操作，但在实际的业务开发中，对锁持有时间做出高效的预判是非常困难的。

Node Redisson 实现了 **看门狗** 与 **锁释放通知** 机制，让您不再苦恼于锁持有时间的预判。

当然，您也可以手动设定锁的持续时间。

## 环境依赖

- Node.js >= 16
- Redis >= 3（使用 PubSub 作为消息实现时）

::: info
Redis 版本与消息实现具有相关性，默认使用 Pub/Sub 时 Redis 版本 >= 3，使用 Streams 时 Redis 版本需 >= 5。
:::

## 感谢

感谢您的使用，如果喜欢本项目，请给本项目 [Github](https://github.com/smilecc/node-redisson) 点个 Star 吧，谢谢。
