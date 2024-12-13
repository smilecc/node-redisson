import Redis, { Cluster } from 'ioredis';
import { ServiceManager } from '../manager/ServiceManager';
import { IRedissonInnerConfig } from './IRedissonConfig';

export const SYMBOL_TIMEOUT = Symbol();

export type RedissonRedis = Redis | Cluster;

export enum UnlockMessages {
  UNLOCK = 0,
  READ_UNLOCK = 1,
}

export interface ICommandExecutor {
  get id(): string;
  get redis(): RedissonRedis;
  get subscribeRedis(): RedissonRedis;
  get redissonConfig(): IRedissonInnerConfig;
  get serviceManager(): ServiceManager;

  subscribe<T>(eventName: string, listener: (e: T) => void): Promise<void>;
  unsubscribe(eventName: string, listener: (...args: any[]) => void): Promise<void>;
  subscribeOnce<T>(eventName: string, listener: (e: T) => void): Promise<void>;
  waitSubscribeOnce<T>(eventName: string, timeout?: number): Promise<T | typeof SYMBOL_TIMEOUT>;
  publish(eventName: string, e: string): Promise<string | null>;
}
