export type RedissionTime = number | bigint;

export class TimeUnit {
  private readonly _baseMs: bigint;

  constructor(public readonly baseMs: RedissionTime) {
    if (typeof baseMs === 'number') {
      this._baseMs = BigInt(baseMs);
    } else {
      this._baseMs = baseMs;
    }
  }

  static MILLISECONDS = new TimeUnit(1n);
  static SECONDS = new TimeUnit(1000n);
  static MINUTES = new TimeUnit(60_000n);
  static HOURS = new TimeUnit(3600_000n);
  static DAYS = new TimeUnit(86400_000n);

  /**
   * Get current time.
   * - Unit: ms
   * @returns time
   */
  static now() {
    return BigInt(new Date().getTime());
  }

  toMillis(d: RedissionTime) {
    return BigInt(d) * this._baseMs;
  }

  toSeconds(d: RedissionTime) {
    return (BigInt(d) * this._baseMs) / TimeUnit.SECONDS._baseMs;
  }

  toHours(d: RedissionTime) {
    return (BigInt(d) * this._baseMs) / TimeUnit.HOURS._baseMs;
  }

  toDays(d: RedissionTime) {
    return (BigInt(d) * this._baseMs) / TimeUnit.DAYS._baseMs;
  }
}
