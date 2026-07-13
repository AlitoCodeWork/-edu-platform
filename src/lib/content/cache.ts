interface Entry<T> {
  value: T;
  expires: number;
}

/** A tiny in-memory TTL cache (used to respect external API quotas). */
export class TtlCache<T> {
  private store = new Map<string, Entry<T>>();

  constructor(
    private ttlMs: number,
    private now: () => number = () => Date.now()
  ) {}

  get(key: string): T | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (this.now() >= e.expires) {
      this.store.delete(key);
      return undefined;
    }
    return e.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expires: this.now() + this.ttlMs });
  }
}
