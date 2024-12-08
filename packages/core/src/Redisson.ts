import { ICommandExecutor } from './contracts/ICommandExecutor';
import { IRedissionClient } from './contracts/IRedissionClient';
import { IRedissionConfig, IRedissionInnerConfig } from './contracts/IRedissionConfig';
import { IRLock } from './contracts/IRLock';
import { CommandExecutor } from './executor/CommandExecutor';
import { RedissionLock } from './locks/RedissionLock';

export class Redission implements IRedissionClient {
  private commandExecutor: ICommandExecutor;

  constructor(private readonly config: IRedissionConfig) {
    this.commandExecutor = new CommandExecutor(this.withDefaultConfig(config));
  }

  private withDefaultConfig(config: IRedissionConfig): IRedissionInnerConfig {
    const { lockWatchdogTimeout = 30_000n } = config;

    return {
      ...config,
      lockWatchdogTimeout,
    };
  }

  getLock(name: string): IRLock {
    return new RedissionLock(this.commandExecutor, name);
  }
}
