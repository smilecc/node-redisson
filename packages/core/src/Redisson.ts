import { ICommandExecutor } from './contracts/ICommandExecutor';
import { IRedissonClient } from './contracts/IRedissonClient';
import { IRedissonConfig, IRedissonInnerConfig } from './contracts/IRedissonConfig';
import { IRLock } from './contracts/IRLock';
import { StreamsCommandExecutor } from './executor/StreamsCommandExecutor';
import { RedissonLock } from './locks/RedissonLock';

export class Redisson implements IRedissonClient {
  private commandExecutor: ICommandExecutor;

  constructor(private readonly config: IRedissonConfig) {
    const innerConfig = this.withDefaultConfig(config);

    if (innerConfig.eventAdapter === 'streams') {
      this.commandExecutor = new StreamsCommandExecutor(innerConfig);
    } else {
      throw new Error('not implemented.');
    }
  }

  private withDefaultConfig(config: IRedissonConfig): IRedissonInnerConfig {
    const { lockWatchdogTimeout = 30_000n, eventAdapter = 'streams' } = config;

    return {
      lockWatchdogTimeout,
      eventAdapter,
      ...config,
    };
  }

  getLock(name: string): IRLock {
    return new RedissonLock(this.commandExecutor, name);
  }
}
