import { IRLock } from './IRLock';

export interface IRedissionClient {
  getLock(name: string): IRLock;
}
