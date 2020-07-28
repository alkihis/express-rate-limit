import { RateLimitInfo, RateLimitOptions } from './types';
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            /**
             * property is added to all requests with the limit, current,
             * and remaining number of requests and, if the store provides it, a resetTime Date object.
             * These may be used in your application code to take additional actions or inform the user of their status
             */
            rateLimit: RateLimitInfo;
        }
    }
}
export declare function RateLimit(options: RateLimitOptions): {
    (req: Request, res: Response, next: NextFunction): Promise<any>;
    resetKey: (key: string) => void;
    resetIp: (key: string) => void;
};
export default RateLimit;
