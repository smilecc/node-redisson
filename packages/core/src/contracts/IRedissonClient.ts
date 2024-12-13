import { IRLock } from './IRLock';

export interface IRedissonClient {
  getLock(name: string): IRLock;
}
