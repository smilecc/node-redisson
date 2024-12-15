import { Redisson } from 'node-redisson';

const redisson = new Redisson({
  redis: {
    options: {
      host: '127.0.0.1',
      port: 42800,
    },
  },
});

(async () => {
  // create a lock
  const lock = redisson.getLock('Example:FirstLock');

  // acquire lock
  await lock.lock();

  // free the lock
  await lock.unlock();
})();
