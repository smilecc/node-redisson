import Redis from 'ioredis';
import { ServiceManager } from '../manager/ServiceManager';
import { IRedissionInnerConfig } from './IRedissionConfig';

export interface ICommandExecutor {
  get id(): string;
  get redis(): Redis;
  get redissionConfig(): IRedissionInnerConfig;
  get serviceManager(): ServiceManager;
}
