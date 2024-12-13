import { ICommandExecutor, SYMBOL_TIMEOUT, RedissonRedis } from '../contracts/ICommandExecutor';
import Redis, { Result, RedisOptions } from 'ioredis';
import { ServiceManager } from '../manager/ServiceManager';
import { IRedissonInnerConfig } from '../contracts/IRedissonConfig';
import { randomUUID } from 'crypto';

declare module 'ioredis' {
  interface RedisCommander<Context> {
    rTryLockInner(lockKey: string, leaseTime: bigint, lockName: string): Result<number | null, Context>;
    rRenewExpiration(lockKey: string, leaseTime: bigint, lockName: string): Result<0 | 1, Context>;
    rUnlockInner(
      lockKey: string,
      lockName: string,
      unlockLatchName: string,
      unlockMessage: bigint,
      LeaseTime: bigint,
      clientName: string,
      publish: string,
    ): Result<0 | 1, Context>;
  }
}

const REDIS_SCRIPTS: RedisOptions['scripts'] = {
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
  redis.call('set', KEYS[3], 0, 'px', ARGV[5]);
  return 0;
else
  redis.call('del', KEYS[1]);
  redis.call(ARGV[4], KEYS[2], ARGV[1]);
  redis.call('set', KEYS[3], 1, 'px', ARGV[5]);
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
};

export abstract class CommandExecutor implements ICommandExecutor {
  abstract subscribe<T>(eventName: string, listener: (e: T) => void): Promise<void>;
  abstract unsubscribe(eventName: string, listener: (...args: any[]) => void): Promise<void>;
  abstract subscribeOnce<T>(eventName: string, listener: (e: T) => void): Promise<void>;
  abstract waitSubscribeOnce<T>(eventName: string, timeout?: number): Promise<T | typeof SYMBOL_TIMEOUT>;
  abstract publish(eventName: string, e: string): Promise<string | null>;

  private _id: string;
  private _redis: RedissonRedis;
  private _subscribeRedis: RedissonRedis;

  constructor(private readonly config: IRedissonInnerConfig) {
    this._id = randomUUID();
    this._redis = this.createRedis();
    this._subscribeRedis = this.createRedis();
  }

  private createRedis() {
    if ('clusters' in this.config.redis) {
      return new Redis.Cluster(this.config.redis.clusters, {
        ...this.config.redis.options,
        scripts: REDIS_SCRIPTS,
      });
    } else {
      return new Redis({
        ...this.config.redis.options,
        scripts: REDIS_SCRIPTS,
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
