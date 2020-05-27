"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimit = void 0;
const memory_store_1 = __importDefault(require("./memory-store"));
function RateLimit(options) {
    var _a;
    options = Object.assign({
        windowMs: 60 * 1000,
        max: 5,
        message: "Too many requests, please try again later.",
        statusCode: 429,
        headers: true,
        draft_polli_ratelimit_headers: false,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
        // allows to create custom keys (by default user IP is used)
        keyGenerator: function (req /*, res*/) {
            return req.ip;
        },
        skip: function ( /*req, res*/) {
            return false;
        },
        handler: function (req, res /*, next*/) {
            var _a;
            res.status((_a = options.statusCode) !== null && _a !== void 0 ? _a : 200).send(options.message);
        },
        onLimitReached: function ( /*req, res, optionsUsed*/) { },
    }, options);
    // store to use for persisting rate limit data
    options.store = options.store || new memory_store_1.default((_a = options.windowMs) !== null && _a !== void 0 ? _a : 1000);
    // ensure that the store has the incr method
    if (typeof options.store.incr !== "function" ||
        typeof options.store.resetKey !== "function" ||
        (options.skipFailedRequests &&
            typeof options.store.decrement !== "function")) {
        throw new Error("The store is not valid.");
    }
    ["global", "delayMs", "delayAfter"].forEach((key) => {
        // note: this doesn't trigger if delayMs or delayAfter are set to 0, because that essentially disables them
        if (key in options) {
            throw new Error(`The ${key} option was removed from express-rate-limit v3.`);
        }
    });
    async function rateLimit(req, res, next) {
        if (options.skip(req, res)) {
            return next();
        }
        try {
            const key = await options.keyGenerator(req, res);
            const [current, resetTime] = await new Promise((resolve, reject) => {
                options.store.incr(key, (err, cur, reset) => {
                    if (err)
                        reject(err);
                    resolve([cur, reset]);
                });
            });
            const max = await (typeof options.max === "function" ? options.max(req, res) : options.max);
            req.rateLimit = {
                limit: max,
                current: current,
                remaining: Math.max(max - current, 0),
                resetTime: resetTime,
            };
            if (options.headers && !res.headersSent) {
                res.setHeader("X-RateLimit-Limit", max);
                res.setHeader("X-RateLimit-Remaining", req.rateLimit.remaining);
                if (resetTime instanceof Date) {
                    // if we have a resetTime, also provide the current date to help avoid issues with incorrect clocks
                    // @ts-ignore
                    res.setHeader("Date", new Date().toGMTString());
                    res.setHeader("X-RateLimit-Reset", Math.ceil(resetTime.getTime() / 1000));
                }
            }
            if (options.draft_polli_ratelimit_headers && !res.headersSent) {
                res.setHeader("RateLimit-Limit", max);
                res.setHeader("RateLimit-Remaining", req.rateLimit.remaining);
                if (resetTime) {
                    const deltaSeconds = Math.ceil((resetTime.getTime() - Date.now()) / 1000);
                    res.setHeader("RateLimit-Reset", Math.max(0, deltaSeconds));
                }
            }
            if (options.skipFailedRequests || options.skipSuccessfulRequests) {
                let decremented = false;
                const decrementKey = () => {
                    if (!decremented) {
                        options.store.decrement(key);
                        decremented = true;
                    }
                };
                if (options.skipFailedRequests) {
                    res.on("finish", function () {
                        if (res.statusCode >= 400) {
                            decrementKey();
                        }
                    });
                    res.on("close", () => {
                        if (!res.finished) {
                            decrementKey();
                        }
                    });
                    res.on("error", () => decrementKey());
                }
                if (options.skipSuccessfulRequests) {
                    res.on("finish", function () {
                        if (res.statusCode < 400) {
                            options.store.decrement(key);
                        }
                    });
                }
            }
            if (max && current === max + 1) {
                options.onLimitReached(req, res, options);
            }
            if (max && current > max) {
                if (options.headers && !res.headersSent) {
                    res.setHeader("Retry-After", Math.ceil(options.windowMs / 1000));
                }
                return options.handler(req, res, next);
            }
            next();
        }
        catch (e) {
            next(e);
        }
    }
    rateLimit.resetKey = options.store.resetKey.bind(options.store);
    // Backward compatibility function
    rateLimit.resetIp = rateLimit.resetKey;
    return rateLimit;
}
exports.RateLimit = RateLimit;
module.exports = RateLimit;
