import { SYMBOL_TIMEOUT } from '../contracts/ICommandExecutor';
import { IRedissonInnerConfig } from '../contracts/IRedissonConfig';
import { PartialRecord } from '../utils/types';
import { CommandExecutor, DEFAULT_REDIS_SCRIPTS, RedisScriptsKey } from './CommandExecutor';
import EventEmitter from 'node:events';

const REDIS_STREAMS_KEY = 'redisson:events';
const STREAMS_MAX_LEN = '100';

export class StreamsCommandExecutor extends CommandExecutor {
  private readonly eventEmitter: EventEmitter;

  constructor(config: IRedissonInnerConfig) {
    super(config);

    this.eventEmitter = new EventEmitter();
    this.listenForMessage();
  }

  async listenForMessage(lastId = '$') {
    let nextId = lastId;
    const results = await this.subscribeRedis.xread('BLOCK', 0, 'STREAMS', REDIS_STREAMS_KEY, lastId);

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

  waitSubscribeOnce<T>(eventName: string, timeout?: number): Promise<T | typeof SYMBOL_TIMEOUT> {
    return new Promise(async (resolve) => {
      const handler = (e: T) => {
        resolve(e);
      };

      if (timeout) {
        setTimeout(async () => {
          await this.unsubscribe(eventName, handler);
          resolve(SYMBOL_TIMEOUT);
        }, timeout);
      }

      await this.subscribeOnce<T>(eventName, handler);
    });
  }

  async publish(eventName: string, e: string): Promise<string | null> {
    const id = await this.redis.xadd(REDIS_STREAMS_KEY, 'MAXLEN', '~', STREAMS_MAX_LEN, '*', eventName, e);
    // console.log('publish', eventName, e, id);
    return id;
  }

  getRedisScripts(): PartialRecord<RedisScriptsKey, string> {
    const unlockCommand = `redis.call('xadd', 'MAXLEN', '~', ${STREAMS_MAX_LEN}, '*', KEYS[2], ARGV[1]);`;
    return {
      rUnlockInner: DEFAULT_REDIS_SCRIPTS.rTryLockInner.lua.replace('#PUB_UNLOCK_REPLACE#', unlockCommand),
      rForceUnlock: DEFAULT_REDIS_SCRIPTS.rForceUnlock.lua.replace('#PUB_UNLOCK_REPLACE#', unlockCommand),
    };
  }
}
