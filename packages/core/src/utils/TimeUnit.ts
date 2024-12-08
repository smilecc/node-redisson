export class TimeUnit {
  constructor(public readonly baseMs: bigint) {}

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
  static now(): bigint {
    return BigInt(new Date().getTime());
  }

  toMillis(d: bigint) {
    return d * this.baseMs;
  }

  toSeconds(d: bigint) {
    return (d * this.baseMs) / TimeUnit.SECONDS.baseMs;
  }

  toHours(d: bigint) {
    return (d * this.baseMs) / TimeUnit.HOURS.baseMs;
  }

  toDays(d: bigint) {
    return (d * this.baseMs) / TimeUnit.DAYS.baseMs;
  }
}
