import Redis from 'ioredis';
import { SYMBOL_TIMEOUT } from '../contracts/ICommandExecutor';
import { IRedissonInnerConfig } from '../contracts/IRedissonConfig';
import { PartialRecord } from '../types';
import { CommandExecutor, DEFAULT_REDIS_SCRIPTS, RedisScriptsKey } from './CommandExecutor';
import EventEmitter from 'node:events';

export class PubSubCommandExecutor extends CommandExecutor {
  private readonly eventEmitter: EventEmitter;
  constructor(config: IRedissonInnerConfig) {
    super(config);

    this.eventEmitter = new EventEmitter();
    (this.subscribeRedis as Redis).on('message', (channel, message) => {
      this.eventEmitter.emit(channel, message);
    });
  }

  async subscribe<T>(eventName: string, listener: (e: T) => void): Promise<void> {
    await this.subscribeRedis.subscribe(eventName);
    this.eventEmitter.on(eventName, listener);
  }

  async unsubscribe(eventName: string, listener: (...args: any[]) => void): Promise<void> {
    await this.subscribeRedis.unsubscribe(eventName);
    this.eventEmitter.off(eventName, listener);
  }

  async subscribeOnce<T>(eventName: string, listener: (e: T) => void): Promise<void> {
    await this.subscribeRedis.subscribe(eventName);
    this.eventEmitter.once(eventName, listener);
  }

  async publish(eventName: string, e: string): Promise<string | null> {
    await this.redis.publish(eventName, e);
    return null;
  }

  getRedisScripts(): PartialRecord<RedisScriptsKey, string> {
    const unlockCommand = `redis.call('publish', KEYS[2], ARGV[1]);`;
    return {
      rUnlockInner: DEFAULT_REDIS_SCRIPTS.rUnlockInner.lua.replace('#PUB_UNLOCK_REPLACE#', unlockCommand),
      rForceUnlock: DEFAULT_REDIS_SCRIPTS.rForceUnlock.lua.replace('#PUB_UNLOCK_REPLACE#', unlockCommand),
    };
  }
}
