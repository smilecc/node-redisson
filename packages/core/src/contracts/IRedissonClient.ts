import { RedissonRedis } from './ICommandExecutor';
import { IRLock } from './IRLock';

export interface IRedissonClient {
  get redis(): Omit<RedissonRedis, `${string}subscribe`>;

  getLock(name: string): IRLock;
  getLock(name: string, clientId: string): IRLock;

  quit(): Promise<void>;
}
