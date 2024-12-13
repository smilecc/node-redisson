import { RedisOptions } from 'ioredis';
import { IRedissonConfig } from '../contracts/IRedissonConfig';

export class ServiceManager {
  constructor(private readonly redisOptions: RedisOptions, private readonly redissonConfig: IRedissonConfig) {}
}
