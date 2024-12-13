import { ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';

export interface IRedissonConfig {
  redis: { options: RedisOptions } | { clusters: ClusterNode[]; options?: ClusterOptions };

  eventAdapter?: 'streams' | 'pubsub';

  /**
   * This parameter is only used if lock has been acquired without leaseTimeout parameter definition.
   * Lock expires after `lockWatchdogTimeout` if watchdog
   * didn't extend it to next `lockWatchdogTimeout` time interval.
   *
   * This prevents against infinity locked locks due to Redisson client crush or
   * any other reason when lock can't be released in proper way.
   *
   * - Unit: milliseconds
   * - Default: 30000 milliseconds
   */
  lockWatchdogTimeout?: bigint;
}

type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
  [Property in Key]-?: Type[Property];
};

export interface IRedissonInnerConfig
  extends WithRequiredProperty<IRedissonConfig, 'lockWatchdogTimeout' | 'eventAdapter'> {}
