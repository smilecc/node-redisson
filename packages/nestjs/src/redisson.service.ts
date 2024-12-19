import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redisson } from 'node-redisson';

@Injectable()
export class RedissonService extends Redisson implements OnModuleDestroy {
  async onModuleDestroy() {
    await this.quit();
  }
}
