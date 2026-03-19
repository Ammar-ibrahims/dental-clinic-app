import * as upstash from '../services/upstashService.js';

/**
 * Basic Rate Limiter using Upstash Redis.
 * @param {number} limit - Max requests allowed.
 * @param {number} windowSeconds - Time window in seconds.
 */
export const rateLimit = (limit = 10, windowSeconds = 60) => {
    return async (req, res, next) => {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const key = `ratelimit:${req.path}:${ip}`;

        try {
            const current = await upstash.incr(key);

            if (current === 1) {
                // New bucket, set expiration
                await upstash.expire(key, windowSeconds);
            }

            if (current > limit) {
                console.warn(`🚫 Rate limit exceeded for ${ip} on ${req.path}`);
                return res.status(429).json({
                    error: 'Too many requests. Please try again later.',
                    retryAfter: windowSeconds
                });
            }

            next();
        } catch (err) {
            console.error('❌ Rate Limiter Error:', err.message);
            // Default to allow on Redis failure so we don't block users if cache is down
            next();
        }
    };
};
