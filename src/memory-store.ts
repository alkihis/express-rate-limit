export function calculateNextResetTime(windowMs: number) {
  const d = new Date();
  d.setMilliseconds(d.getMilliseconds() + windowMs);
  return d;
}

export class MemoryStore {
  hits: { [src: string]: number } = {};
  resetTime: Date;

  constructor(public windowMs: number) {
    this.resetTime = calculateNextResetTime(windowMs);
    const interval = setInterval(this.resetAll.bind(this), windowMs);
    if (interval.unref) {
      interval.unref();
    }
  }

  incr(key: string, cb: (err: any, hit: number, resetTime: Date) => void) {
    if (this.hits[key]) {
      this.hits[key]++;
    } else {
      this.hits[key] = 1;
    }

    cb(null, this.hits[key], this.resetTime);
  }

  decrement(key: string) {
    if (this.hits[key])
      this.hits[key]--;
  }

  resetAll() {
    console.log('reseting');
    this.hits = {};
    this.resetTime = calculateNextResetTime(this.windowMs);
  }

  resetKey(key: string) {
    delete this.hits[key];
  }
}

export default MemoryStore;
