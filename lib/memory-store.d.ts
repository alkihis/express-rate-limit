export declare function calculateNextResetTime(windowMs: number): Date;
export declare class MemoryStore {
    windowMs: number;
    hits: {
        [src: string]: number;
    };
    resetTime: Date;
    constructor(windowMs: number);
    incr(key: string, cb: (err: any, hit: number, resetTime: Date) => void): void;
    decrement(key: string): void;
    resetAll(): void;
    resetKey(key: string): void;
}
export default MemoryStore;
