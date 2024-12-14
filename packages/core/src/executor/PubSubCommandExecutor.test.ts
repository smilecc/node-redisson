import { TestRedisOptions, TestTimeout } from '../test.config';
import { SYMBOL_TIMEOUT } from '../contracts/ICommandExecutor';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { PubSubCommandExecutor } from './PubSubCommandExecutor';

describe('PubSubCommandExecutor', () => {
  jest.setTimeout(TestTimeout);

  let executor: PubSubCommandExecutor;

  beforeAll(async () => {
    executor = new PubSubCommandExecutor({
      lockWatchdogTimeout: 30000n,
      eventAdapter: 'pubsub',
      redis: {
        options: {
          ...(await TestRedisOptions),
          enableReadyCheck: true,
        },
      },
    });

    // wait redis connected
    await new Promise((r) => (executor.subscribeRedis as Redis).once('ready', r));
  });

  it('should be able to pub/sub', (done) => {
    const event = randomUUID();
    const eventContent = randomUUID();

    executor
      .subscribe<string>(event, (v) => {
        expect(v).toBe(eventContent);
        done();
      })
      .then(() => {
        executor.publish(event, eventContent).catch((e) => done(e));
      })
      .catch((e) => done(e));
  });

  it('waitSubscribeOnce should be able to get', async () => {
    const event = randomUUID();
    const eventContent = randomUUID();

    setTimeout(() => executor.publish(event, eventContent), 1000);

    await expect(executor.waitSubscribeOnce<string>(event, 2000)).resolves.toBe(eventContent);
  });

  it('waitSubscribeOnce should be able to timeout', async () => {
    const event = randomUUID();

    await expect(executor.waitSubscribeOnce<string>(event, 1000)).resolves.toBe(SYMBOL_TIMEOUT);
  });
});
