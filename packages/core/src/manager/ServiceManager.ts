import { RedisOptions } from 'ioredis';
import { IRedissionConfig } from '../contracts/IRedissionConfig';

export class ServiceManager {
  constructor(private readonly redisOptions: RedisOptions, private readonly redissionConfig: IRedissionConfig) {}
}
