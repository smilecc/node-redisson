import { randomUUID } from 'node:crypto';
import { ICommandExecutor } from '../contracts/ICommandExecutor';
import { IRLock, RLockLeaseTime, RLockWaitTime } from '../contracts/IRLock';
import { TimeUnit } from '../utils/TimeUnit';
import { RedissonLockError } from '../errors/RedissonLockError';

export type LockClientId = string;

export abstract class RedissonBaseLock implements IRLock {
  private static readonly EXPIRATION_RENEWAL_MAP = new Map<string, ExpirationEntry>();

  protected id: string;
  protected lockName: string;
  protected _clientId: LockClientId;
  protected internalLockLeaseTime: bigint;
  protected readonly entryName: string;

  public static prefixName(prefix: string, name: string) {
    const _name = name.startsWith('{') ? name : `{${name}}`;
    return `${prefix}:${_name}`;
  }

  constructor(protected readonly commandExecutor: ICommandExecutor, lockName: string, clientId?: string) {
    this.id = commandExecutor.id;
    this.lockName = lockName;
    this._clientId = clientId ?? randomUUID();
    this.entryName = `${this.id}:${lockName}`;
    this.internalLockLeaseTime = commandExecutor.redissonConfig.lockWatchdogTimeout;
  }

  get name() {
    return this.lockName;
  }

  get clientId(): LockClientId {
    return this._clientId;
  }

  abstract tryLock(waitTime: RLockWaitTime, leaseTime: RLockLeaseTime, unit?: TimeUnit): Promise<boolean>;
  abstract lock(leaseTime?: RLockLeaseTime, unit?: TimeUnit): Promise<void>;
  abstract forceUnlock(): Promise<boolean>;
  abstract unlockInner(clientId: LockClientId, requestId: string, timeout: number): Promise<boolean | null>;

  async unlock(): Promise<void> {
    const requestId = randomUUID();
    const unlockResult = await this.unlockInner(this.clientId, requestId, 10);
    await this.commandExecutor.redis.del(this.getUnlockLatchName(requestId));

    if (unlockResult === null) {
      throw new RedissonLockError(
        `attempt to unlock lock, not locked by current client`,
        this.lockName,
        this.id,
        this.clientId,
      );
    }

    this.cancelExpirationRenewal(unlockResult, this.clientId);
  }

  async isLocked(): Promise<boolean> {
    const count = await this.commandExecutor.redis.exists(this.lockName);
    return count > 0;
  }

  protected getClientName(clientId: LockClientId) {
    return `${this.id}:${clientId}`;
  }

  protected getUnlockLatchName(requestId: string) {
    return `${RedissonBaseLock.prefixName('redisson_unlock_latch', this.lockName)}:${requestId}`;
  }

  protected scheduleExpirationRenewal(clientId: LockClientId) {
    const oldEntry = RedissonBaseLock.EXPIRATION_RENEWAL_MAP.get(this.entryName);

    if (oldEntry) {
      oldEntry.addClientId(clientId);
    } else {
      const entry = new ExpirationEntry();
      entry.addClientId(clientId);
      RedissonBaseLock.EXPIRATION_RENEWAL_MAP.set(this.entryName, entry);

      this.renewExpiration();
    }
  }

  protected renewExpiration() {
    const ee = RedissonBaseLock.EXPIRATION_RENEWAL_MAP.get(this.entryName);

    if (!ee) {
      return;
    }

    ee.timeoutId = setTimeout(async () => {
      try {
        const ent = RedissonBaseLock.EXPIRATION_RENEWAL_MAP.get(this.entryName);

        if (!ent) {
          return;
        }

        const clientId = ent.firstClientId;
        if (!clientId) {
          return;
        }

        const result = await this.commandExecutor.redis.rRenewExpiration(
          this.lockName,
          this.internalLockLeaseTime,
          this.getClientName(clientId),
        );

        if (result) {
          this.renewExpiration();
        } else {
          this.cancelExpirationRenewal(true);
        }
      } catch (e) {
        // TODO std logger
        console.error(e);
      }
    }, Number(`${this.internalLockLeaseTime / 3n}`));
  }

  protected cancelExpirationRenewal(unlockResult: boolean, clientId?: LockClientId) {
    // Recover the lockLeaseTime from config
    if (unlockResult) {
      this.internalLockLeaseTime = this.commandExecutor.redissonConfig.lockWatchdogTimeout;
    }

    // Remove entry from map
    const task = RedissonBaseLock.EXPIRATION_RENEWAL_MAP.get(this.entryName);
    if (!task) {
      return;
    }

    if (clientId) {
      task.removeClientId(clientId);
    }

    if (!clientId || task.hasNoClients) {
      if (task.timeoutId) {
        clearTimeout(task.timeoutId);
      }

      RedissonBaseLock.EXPIRATION_RENEWAL_MAP.delete(this.entryName);
    }
  }
}

export class ExpirationEntry {
  public timeoutId?: NodeJS.Timeout;
  private clientsQueue: LockClientId[] = [];
  private readonly clientIds = new Map<LockClientId, number>();

  addClientId(clientId: LockClientId) {
    this.clientIds.set(clientId, this.getClientCounter(clientId) + 1);
    this.clientsQueue.push(clientId);
  }

  removeClientId(clientId: LockClientId) {
    if (this.clientIds.has(clientId)) {
      // decrement the counter
      const counter = this.getClientCounter(clientId) - 1;

      // if counter <= 0, remove the clientId
      if (counter <= 0) {
        this.clientsQueue = this.clientsQueue.filter((it) => it !== clientId);
        this.clientIds.delete(clientId);
      }

      this.clientIds.set(clientId, counter);
    }
  }

  get hasNoClients() {
    return this.clientsQueue.length <= 0;
  }

  get firstClientId() {
    return this.clientsQueue[0];
  }

  getClientCounter(clientId: string, defaultCounter: number = 0) {
    return this.clientIds.get(clientId) ?? defaultCounter;
  }
}
