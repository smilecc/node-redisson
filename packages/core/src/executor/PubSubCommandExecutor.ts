import { SYMBOL_TIMEOUT } from '../contracts/ICommandExecutor';
import { IRedissonInnerConfig } from '../contracts/IRedissonConfig';
import { CommandExecutor } from './CommandExecutor';

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
}
