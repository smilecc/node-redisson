import { StartedRedisContainer } from '@testcontainers/redis';
import { TestRedisContainer, TestTimeout } from '../utils/test.utils';
import { StreamsCommandExecutor } from './StreamsCommandExecutor';
import { SYMBOL_TIMEOUT } from '../contracts/ICommandExecutor';
import Redis from 'ioredis';

describe('StreamsCommandExecutor', () => {
  jest.setTimeout(TestTimeout);

  let redisContainer: StartedRedisContainer;
  let executor: StreamsCommandExecutor;

  beforeAll(async () => {
    redisContainer = await TestRedisContainer;
    executor = new StreamsCommandExecutor({
      lockWatchdogTimeout: 30000n,
      redis: {
        options: {
          host: redisContainer.getHost(),
          port: redisContainer.getPort(),
          password: redisContainer.getPassword(),
          enableReadyCheck: true,
        },
      },
    });

    // wait redis connected
    await new Promise((r) => (executor.subscribeRedis as Redis).once('ready', r));
  });

  it('should be able to pub/sub', (done) => {
    const event = crypto.randomUUID();
    const eventContent = crypto.randomUUID();

    executor
      .waitSubscribeOnce<string>(event)
      .then((v) => {
        expect(v).toBe(eventContent);
        done();
      })
      .catch((e) => done(e));

    executor.publish(event, eventContent).catch((e) => done(e));
  });

  it('waitSubscribeOnce should be able to timeout', async () => {
    const event = crypto.randomUUID();

    await expect(executor.waitSubscribeOnce<string>(event, 1000)).resolves.toBe(SYMBOL_TIMEOUT);
  });
});
