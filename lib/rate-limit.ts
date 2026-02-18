/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and DoS attacks
 */

import rateLimit from 'express-rate-limit'
import { config } from './config'

/**
 * General API rate limit
 * Applies to all read operations (balance checks, transaction history)
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.generalMax,
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: config.rateLimit.retryAfter
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,  // Disable `X-RateLimit-*` headers
})

/**
 * Transaction rate limit
 * More restrictive for write operations (topup, bonus, spend)
 * Prevents rapid-fire spending attacks
 */
export const transactionLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.transactionMax,
  message: {
    error: 'Too many transactions, please try again later',
    retryAfter: config.rateLimit.retryAfter
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Balance check rate limit
 * Allows frequent polling without abuse
 */
export const balanceLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.balanceMax,
  message: {
    error: 'Too many balance requests, please try again later',
    retryAfter: config.rateLimit.retryAfter
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Strict rate limit for sensitive operations
 * Use for admin operations or high-value transactions
 */
export const strictLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.strictMax,
  message: {
    error: 'Rate limit exceeded for sensitive operation',
    retryAfter: config.rateLimit.retryAfter
  },
  standardHeaders: true,
  legacyHeaders: false,
})
