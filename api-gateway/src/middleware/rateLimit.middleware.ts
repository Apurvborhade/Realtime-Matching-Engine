import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,

    handler: (req: any, res, next, options) => {
        res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many requests from this IP, please try again later',
            retryAfter: Math.round(req.rateLimit.resetTime / 1000)
        });
    }
});