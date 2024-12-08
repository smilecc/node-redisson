import { ICommandExecutor } from '../contracts/ICommandExecutor';
import { IRLock } from '../contracts/IRLock';
import { TimeUnit } from '../utils/TimeUnit';

export type LockClientId = string;

export abstract class RedissionBaseLock implements IRLock {
  private static readonly EXPIRATION_RENEWAL_MAP = new Map<string, ExpirationEntry>();

  protected internalLockLeaseTime: bigint;
  protected readonly entryName: string;

  constructor(protected readonly commandExecutor: ICommandExecutor, protected readonly lockName: string) {
    this.internalLockLeaseTime = commandExecutor.redissionConfig.lockWatchdogTimeout;
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

  protected getLockName(clientId: LockClientId) {
    return `${this.commandExecutor.id}:${clientId}`;
  }

  /**
   * TODO 续期
   */
  protected async scheduleExpirationRenewal(clientId: LockClientId) {
    const oldEntry = RedissionBaseLock.EXPIRATION_RENEWAL_MAP.get(this.entryName);

    if (oldEntry) {
      oldEntry.addClientId(clientId);
    } else {
      const entry = new ExpirationEntry();
      RedissionBaseLock.EXPIRATION_RENEWAL_MAP.set(this.entryName, entry);

      await this.renewExpiration();
    }
  }

  protected async renewExpiration() {
    const ee = RedissionBaseLock.EXPIRATION_RENEWAL_MAP.get(this.entryName);

    if (!ee) {
      return;
    }

    setTimeout(async () => {
      const ent = RedissionBaseLock.EXPIRATION_RENEWAL_MAP.get(this.entryName);

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
        this.getLockName(clientId),
      );

      if (result) {
        this.renewExpiration();
      } else {
        this.cancelExpirationRenewal();
      }
    }, Number((this.internalLockLeaseTime / 3n).toString()));
  }

  protected cancelExpirationRenewal(clientId?: LockClientId, unlockResult?: boolean) {
    const task = RedissionBaseLock.EXPIRATION_RENEWAL_MAP.get(this.entryName);
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

      RedissionBaseLock.EXPIRATION_RENEWAL_MAP.delete(this.entryName);
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
