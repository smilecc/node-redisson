import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { Redission } from '../Redisson';

describe('Redission Lock', () => {
  jest.setTimeout(30000);

  let redisContainer: StartedRedisContainer;
  let redission: Redission;

  beforeAll(async () => {
    redisContainer = await new RedisContainer('redis:7.4.1-alpine').start();

    redission = new Redission({
      redisOptions: {
        host: redisContainer.getHost(),
        port: redisContainer.getPort(),
        password: redisContainer.getPassword(),
      },
    });
  });

  it('should connected', async () => {
    const redis = redission['commandExecutor'].redis;
    const randomKey = crypto.randomUUID();
    const randomValue = crypto.randomUUID();

    await expect(redis.set(randomKey, randomValue)).resolves.toBe('OK');
    await expect(redis.get(randomKey)).resolves.toBe(randomValue);
  });
});
