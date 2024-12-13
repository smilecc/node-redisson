import { ICommandExecutor } from '../contracts/ICommandExecutor';
import { IRLock } from '../contracts/IRLock';
import { TimeUnit } from '../utils/TimeUnit';

export type LockClientId = string;

export abstract class RedissonBaseLock implements IRLock {
  private static readonly EXPIRATION_RENEWAL_MAP = new Map<string, ExpirationEntry>();

  protected internalLockLeaseTime: bigint;
  protected readonly entryName: string;

  public static prefixName(prefix: string, name: string) {
    const _name = name.startsWith('{') ? name : `{${name}}`;
    return `${prefix}:${_name}`;
  }

  constructor(protected readonly commandExecutor: ICommandExecutor, protected readonly lockName: string) {
    this.internalLockLeaseTime = commandExecutor.redissonConfig.lockWatchdogTimeout;
    this.entryName = `${commandExecutor.id}:${lockName}`;
  }

  get name() {
    return this.lockName;
  }

  abstract lockInterruptibly(leaseTime: bigint, unit: TimeUnit): Promise<void>;
  abstract tryLock(waitTime: bigint, leaseTime: bigint, unit: TimeUnit): Promise<boolean>;
  abstract lock(leaseTime: bigint, unit: TimeUnit): Promise<void>;
  abstract forceUnlock(): Promise<boolean>;
  abstract isLocked(): Promise<boolean>;

  protected getClientName(clientId: LockClientId) {
    return `${this.commandExecutor.id}:${clientId}`;
  }

  protected scheduleExpirationRenewal(clientId: LockClientId) {
    const oldEntry = RedissonBaseLock.EXPIRATION_RENEWAL_MAP.get(this.entryName);

    if (oldEntry) {
      oldEntry.addClientId(clientId);
    } else {
      const entry = new ExpirationEntry();
      RedissonBaseLock.EXPIRATION_RENEWAL_MAP.set(this.entryName, entry);

      this.renewExpiration();
    }
  }

  protected renewExpiration() {
    const ee = RedissonBaseLock.EXPIRATION_RENEWAL_MAP.get(this.entryName);

    if (!ee) {
      return;
    }

    setTimeout(async () => {
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
          this.cancelExpirationRenewal();
        }
      } catch (e) {
        // TODO std logger
        console.error(e);
      }
    }, Number(`${this.internalLockLeaseTime / 3n}`));
  }

  protected cancelExpirationRenewal(clientId?: LockClientId, unlockResult?: boolean) {
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

class ExpirationEntry {
  public timeoutId?: number;
  private clientsQueue: LockClientId[] = [];
  private readonly clientIds = new Map<LockClientId, number>();

  addClientId(clientId: LockClientId) {
    this.clientIds.set(clientId, this.clientIds.get(clientId) ?? 0 + 1);
    this.clientsQueue.push(clientId);
  }

  removeClientId(clientId: LockClientId) {
    if (this.clientIds.has(clientId)) {
      // decrement the counter
      const counter = this.clientIds.get(clientId) ?? 0 - 1;

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
}
