import { DynamicModule, Module } from '@nestjs/common';
import type { IRedissonConfig } from 'node-redisson';
import { RedissonService } from './redisson.service';

export type RedissonModuleConfigOption = {
  global?: boolean;
  config: IRedissonConfig;
};

export type RedissonModuleInstanceOption = {
  global?: boolean;
  instance: RedissonService;
};

export type RedissonModuleOption = RedissonModuleConfigOption | RedissonModuleInstanceOption;

@Module({})
export class RedissonModule {
  static register(options: RedissonModuleOption): DynamicModule {
    return {
      module: RedissonModule,
      global: options.global,
      providers: [
        {
          provide: RedissonService,
          useValue: 'instance' in options ? options.instance : new RedissonService(options.config),
        },
      ],
      exports: [RedissonService],
    };
  }
}
