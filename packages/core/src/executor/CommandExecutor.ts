import { ICommandExecutor, SYMBOL_TIMEOUT, RedissonRedis } from '../contracts/ICommandExecutor';
import Redis, { Result, RedisOptions } from 'ioredis';
import { ServiceManager } from '../manager/ServiceManager';
import { IRedissonInnerConfig } from '../contracts/IRedissonConfig';
import { randomUUID } from 'crypto';
import { PartialRecord } from '../utils/types';

export type RedisScriptsKey = 'rTryLockInner' | 'rUnlockInner' | 'rRenewExpiration' | 'rForceUnlock';
export type RedisScriptsValue = NonNullable<RedisOptions['scripts']>[string];
export type RedisScripts = Record<RedisScriptsKey, RedisScriptsValue>;

declare module 'ioredis' {
  interface RedisCommander<Context> {
    rTryLockInner(lockKey: string, leaseTime: bigint, clientName: string): Result<number | null, Context>;
    rRenewExpiration(lockKey: string, leaseTime: bigint, clientName: string): Result<0 | 1, Context>;
    rUnlockInner(
      lockKey: string,
      channelName: string,
      unlockLatchName: string,
      unlockMessage: number,
      leaseTime: bigint,
      clientName: string,
      timeout: number,
    ): Result<0 | 1, Context>;
    rForceUnlock(lockKey: string, channelName: string, unlockMessage: number): Result<0 | 1, Context>;
  }
}

export const DEFAULT_REDIS_SCRIPTS: RedisScripts = Object.freeze<RedisScripts>({
  rTryLockInner: {
    lua: `
if ((redis.call('exists', KEYS[1]) == 0) or (redis.call('hexists', KEYS[1], ARGV[2]) == 1)) then
  redis.call('hincrby', KEYS[1], ARGV[2], 1);
  redis.call('pexpire', KEYS[1], ARGV[1]);
  return nil;
end
return redis.call('pttl', KEYS[1]);`,
    numberOfKeys: 1,
  },
  rUnlockInner: {
    lua: `
local val = redis.call('get', KEYS[3]);
if val ~= false then
  return tonumber(val);
end
if (redis.call('hexists', KEYS[1], ARGV[3]) == 0) then
  return nil;
end
local counter = redis.call('hincrby', KEYS[1], ARGV[3], -1);
if (counter > 0) then
  redis.call('pexpire', KEYS[1], ARGV[2]);
  redis.call('set', KEYS[3], 0, 'px', ARGV[4]);
  return 0;
else
  redis.call('del', KEYS[1]);
  #PUB_UNLOCK_REPLACE#
  redis.call('set', KEYS[3], 1, 'px', ARGV[4]);
  return 1;
end`,
    numberOfKeys: 3,
  },
  rRenewExpiration: {
    lua: `
if (redis.call('hexists', KEYS[1], ARGV[2]) == 1) then 
  redis.call('pexpire', KEYS[1], ARGV[1]);
  return 1;
end;
return 0;`,
    numberOfKeys: 1,
  },
  rForceUnlock: {
    lua: `
if (redis.call('del', KEYS[1]) == 1) then 
  #PUB_UNLOCK_REPLACE#
  return 1
else
  return 0
end`,
    numberOfKeys: 2,
  },
});

export abstract class CommandExecutor implements ICommandExecutor {
  abstract subscribe<T>(eventName: string, listener: (e: T) => void): Promise<void>;
  abstract unsubscribe(eventName: string, listener: (...args: any[]) => void): Promise<void>;
  abstract subscribeOnce<T>(eventName: string, listener: (e: T) => void): Promise<void>;
  abstract waitSubscribeOnce<T>(eventName: string, timeout?: number): Promise<T | typeof SYMBOL_TIMEOUT>;
  abstract publish(eventName: string, e: string): Promise<string | null>;
  abstract getRedisScripts<K>(): PartialRecord<RedisScriptsKey, string>;

  private _id: string;
  private _redis: RedissonRedis;
  private _subscribeRedis: RedissonRedis;

  constructor(private readonly config: IRedissonInnerConfig) {
    this._id = randomUUID();
    this._redis = this.createRedis();
    this._subscribeRedis = this.createRedis();
  }

  private createRedis() {
    const customScripts = this.getRedisScripts();
    const scripts = (Object.keys(DEFAULT_REDIS_SCRIPTS) as RedisScriptsKey[]).reduce((pre, current) => {
      const defaultValue = DEFAULT_REDIS_SCRIPTS[current];
      pre[current] = {
        ...defaultValue,
        lua: customScripts[current] ?? defaultValue.lua,
      };
      return pre;
    }, {} as Record<string, RedisScriptsValue>);

    if ('clusters' in this.config.redis) {
      return new Redis.Cluster(this.config.redis.clusters, {
        ...this.config.redis.options,
        scripts,
      });
    } else {
      return new Redis({
        ...this.config.redis.options,
        scripts,
      });
    }
  }

  get id(): string {
    return this._id;
  }

  get redissonConfig(): IRedissonInnerConfig {
    return this.config;
  }

  get serviceManager(): ServiceManager {
    throw new Error('Method not implemented.');
  }

  get redis(): RedissonRedis {
    return this._redis;
  }

  get subscribeRedis(): RedissonRedis {
    return this._subscribeRedis;
  }
}
