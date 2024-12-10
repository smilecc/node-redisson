import Redis from 'ioredis';
import { ServiceManager } from '../manager/ServiceManager';
import { IRedissionInnerConfig } from './IRedissionConfig';

export const SYMBOL_TIMEOUT = Symbol();

export interface ICommandExecutor {
  get id(): string;
  get redis(): Redis;
  get redissionConfig(): IRedissionInnerConfig;
  get serviceManager(): ServiceManager;

  subscribe<T>(eventName: string, listener: (e: T) => void): Promise<void>;
  unsubscribe(eventName: string, listener: (...args: any[]) => void): Promise<void>;
  subscribeOnce<T>(eventName: string, listener: (e: T) => void): Promise<void>;
  waitSubscribeOnce<T>(eventName: string, timeout?: number): Promise<T | typeof SYMBOL_TIMEOUT>;
}
