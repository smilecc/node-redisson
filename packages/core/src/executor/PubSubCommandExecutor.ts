import { SYMBOL_TIMEOUT } from '../contracts/ICommandExecutor';
import { IRedissonInnerConfig } from '../contracts/IRedissonConfig';
import { PartialRecord } from '../types';
import { CommandExecutor, DEFAULT_REDIS_SCRIPTS, RedisScriptsKey } from './CommandExecutor';

export class PubSubCommandExecutor extends CommandExecutor {
  constructor(config: IRedissonInnerConfig) {
    super(config);
  }

  subscribe<T>(eventName: string, listener: (e: T) => void): Promise<void> {
    throw new Error('Method not implemented.');
  }
  unsubscribe(eventName: string, listener: (...args: any[]) => void): Promise<void> {
    throw new Error('Method not implemented.');
  }
  subscribeOnce<T>(eventName: string, listener: (e: T) => void): Promise<void> {
    throw new Error('Method not implemented.');
  }
  waitSubscribeOnce<T>(eventName: string, timeout?: number): Promise<T | typeof SYMBOL_TIMEOUT> {
    throw new Error('Method not implemented.');
  }
  publish(eventName: string, e: string): Promise<string | null> {
    throw new Error('Method not implemented.');
  }

  getRedisScripts(): PartialRecord<RedisScriptsKey, string> {
    const unlockCommand = `redis.call('publish', KEYS[2], ARGV[1]);`;
    return {
      rUnlockInner: DEFAULT_REDIS_SCRIPTS.rUnlockInner.lua.replace('#PUB_UNLOCK_REPLACE#', unlockCommand),
      rForceUnlock: DEFAULT_REDIS_SCRIPTS.rForceUnlock.lua.replace('#PUB_UNLOCK_REPLACE#', unlockCommand),
    };
  }
}
