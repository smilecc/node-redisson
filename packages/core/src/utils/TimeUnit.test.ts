import { TimeUnit } from './TimeUnit';

describe('utils/TimeUnit', () => {
  it('now', () => {
    expect(typeof TimeUnit.now()).toBe('bigint');
    expect(TimeUnit.now()).toBeGreaterThan(1n);
  });

  it('transform', () => {
    expect(TimeUnit.SECONDS.toMillis(86400)).toBe(86400_000n);
    expect(TimeUnit.SECONDS.toHours(86400)).toBe(24n);
    expect(TimeUnit.SECONDS.toDays(86400)).toBe(1n);
  });
});
