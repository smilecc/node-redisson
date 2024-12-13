export class RedissonLockError extends Error {
  constructor(
    message: string,
    public readonly lockName: string,
    public readonly nodeId: string,
    public readonly clientId: string,
  ) {
    super(`${message}\n${JSON.stringify({ lockName, nodeId, clientId })}`);
  }
}
