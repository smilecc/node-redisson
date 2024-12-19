import { ICommandExecutor, RedissonRedis } from './contracts/ICommandExecutor';
import { IRedissonClient } from './contracts/IRedissonClient';
import { IRedissonConfig, IRedissonInnerConfig } from './contracts/IRedissonConfig';
import { IRLock } from './contracts/IRLock';
import { PubSubCommandExecutor } from './executor/PubSubCommandExecutor';
import { StreamsCommandExecutor } from './executor/StreamsCommandExecutor';
import { RedissonLock } from './locks/RedissonLock';

export class Redisson implements IRedissonClient {
  private commandExecutor: ICommandExecutor;

  constructor(config: IRedissonConfig) {
    const innerConfig = this.withDefaultConfig(config);

    if (innerConfig.eventAdapter === 'streams') {
      this.commandExecutor = new StreamsCommandExecutor(innerConfig);
    } else {
      this.commandExecutor = new PubSubCommandExecutor(innerConfig);
    }
  }

  private withDefaultConfig(config: IRedissonConfig): IRedissonInnerConfig {
    const { lockWatchdogTimeout = 30_000n, eventAdapter = 'pubsub' } = config;

    return {
      lockWatchdogTimeout,
      eventAdapter,
      ...config,
    };
  }

  get redis(): RedissonRedis {
    return this.commandExecutor.redis;
  }

  getLock(name: string, clientId?: string): IRLock {
    return new RedissonLock(this.commandExecutor, name, clientId);
  }

  async quit(): Promise<void> {
    await Promise.allSettled([this.commandExecutor.redis.quit(), this.commandExecutor.subscribeRedis.quit()]);
  }
}
