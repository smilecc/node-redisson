import { ICommandExecutor } from './contracts/ICommandExecutor';
import { IRedissonClient } from './contracts/IRedissonClient';
import { IRedissonConfig, IRedissonInnerConfig } from './contracts/IRedissonConfig';
import { IRLock } from './contracts/IRLock';
import { StreamsCommandExecutor } from './executor/StreamsCommandExecutor';
import { RedissonLock } from './locks/RedissonLock';

export class Redisson implements IRedissonClient {
  private commandExecutor: ICommandExecutor;

  constructor(private readonly config: IRedissonConfig) {
    this.commandExecutor = new StreamsCommandExecutor(this.withDefaultConfig(config));
  }

  private withDefaultConfig(config: IRedissonConfig): IRedissonInnerConfig {
    const { lockWatchdogTimeout = 30_000n } = config;

    return {
      ...config,
      lockWatchdogTimeout,
    };
  }

  getLock(name: string): IRLock {
    return new RedissonLock(this.commandExecutor, name);
  }
}
