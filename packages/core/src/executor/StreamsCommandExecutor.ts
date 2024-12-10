import { IRedissionInnerConfig } from '../contracts/IRedissionConfig';
import { RedissionTime } from '../utils/TimeUnit';
import { CommandExecutor } from './CommandExecutor';
import EventEmitter from 'node:events';

const REDIS_STREAMS_KEY = 'redission:events';

export class StreamsCommandExecutor extends CommandExecutor {
  private readonly eventEmitter: EventEmitter;

  constructor(config: IRedissionInnerConfig) {
    super(config);

    this.eventEmitter = new EventEmitter();
    this.listenForMessage();
  }

  async listenForMessage(lastId = '$') {
    let nextId = lastId;
    const results = await this.redis.xread('BLOCK', 0, 'STREAMS', REDIS_STREAMS_KEY, lastId);

    if (results) {
      const [_, messages] = results[0];
      nextId = messages[messages.length - 1][0];

      messages.forEach(([_, [eventName, e]]) => this.eventEmitter.emit(eventName, e));
    }

    await this.listenForMessage(nextId);
  }

  async subscribe<T>(eventName: string, listener: (e: T) => void): Promise<void> {
    this.eventEmitter.on(eventName, listener);
  }

  async unsubscribe(eventName: string, listener: (...args: any[]) => void): Promise<void> {
    this.eventEmitter.off(eventName, listener);
  }

  async subscribeOnce<T>(eventName: string, listener: (e: T) => void): Promise<void> {
    this.eventEmitter.once(eventName, listener);
  }

  waitSubscribeOnce<T>(eventName: string, timeout?: number): Promise<T | '_TIMEOUT_'> {
    return new Promise(async (resolve, reject) => {
      const handler = (e: T) => resolve(e);

      if (timeout) {
        setTimeout(async () => {
          await this.unsubscribe(eventName, handler);
          resolve('_TIMEOUT_');
        }, timeout);
      }

      await this.subscribeOnce<T>(eventName, handler);
    });
  }
}
