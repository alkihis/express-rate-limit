"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryStore = exports.calculateNextResetTime = void 0;
function calculateNextResetTime(windowMs) {
    const d = new Date();
    d.setMilliseconds(d.getMilliseconds() + windowMs);
    return d;
}
exports.calculateNextResetTime = calculateNextResetTime;
class MemoryStore {
    constructor(windowMs) {
        this.windowMs = windowMs;
        this.hits = {};
        this.resetTime = calculateNextResetTime(windowMs);
        const interval = setInterval(this.resetAll, windowMs);
        if (interval.unref) {
            interval.unref();
        }
    }
    incr(key, cb) {
        if (this.hits[key]) {
            this.hits[key]++;
        }
        else {
            this.hits[key] = 1;
        }
        cb(null, this.hits[key], this.resetTime);
    }
    decrement(key) {
        if (this.hits[key])
            this.hits[key]--;
    }
    resetAll() {
        this.hits = {};
        this.resetTime = calculateNextResetTime(this.windowMs);
    }
    resetKey(key) {
        delete this.hits[key];
    }
}
exports.MemoryStore = MemoryStore;
exports.default = MemoryStore;
