/**
 * Centralized Configuration Module
 * Manages all application settings via environment variables with sensible defaults.
 */

function getEnvInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined || value === '') {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`Invalid value for ${key}: "${value}". Using default: ${defaultValue}`);
    return defaultValue;
  }
  return parsed;
}

export const config = {
  // Rate Limiting
  rateLimit: {
    windowMs: getEnvInt('RATE_LIMIT_WINDOW_MS', 60 * 1000), // 1 minute
    generalMax: getEnvInt('RATE_LIMIT_GENERAL_MAX', 100),
    transactionMax: getEnvInt('RATE_LIMIT_TRANSACTION_MAX', 20),
    balanceMax: getEnvInt('RATE_LIMIT_BALANCE_MAX', 50),
    strictMax: getEnvInt('RATE_LIMIT_STRICT_MAX', 10),
    retryAfter: getEnvInt('RATE_LIMIT_RETRY_AFTER', 60),
  },

  // Transaction Limits
  transactionLimits: {
    maxTopupAmount: getEnvInt('MAX_TOPUP_AMOUNT', 10000),
    maxSpendAmount: getEnvInt('MAX_SPEND_AMOUNT', 5000),
    maxDailySpend: getEnvInt('MAX_DAILY_SPEND', 20000),
    maxMonthlySpend: getEnvInt('MAX_MONTHLY_SPEND', 100000),
  },

  // Validation Rules
  validation: {
    maxDecimalPlaces: getEnvInt('MAX_DECIMAL_PLACES', 2),
    maxStringLength: getEnvInt('MAX_STRING_LENGTH', 255),
    idempotencyKeyMinLength: getEnvInt('IDEMPOTENCY_KEY_MIN_LENGTH', 1),
    idempotencyKeyMaxLength: getEnvInt('IDEMPOTENCY_KEY_MAX_LENGTH', 255),
  },

  // Retry Logic
  retry: {
    maxAttempts: getEnvInt('RETRY_MAX_ATTEMPTS', 3),
    initialDelayMs: getEnvInt('RETRY_INITIAL_DELAY_MS', 100),
    maxDelayMs: getEnvInt('RETRY_MAX_DELAY_MS', 5000),
    backoffMultiplier: getEnvInt('RETRY_BACKOFF_MULTIPLIER', 2),
  },

  // Metrics
  metrics: {
    defaultWindowMinutes: getEnvInt('METRICS_DEFAULT_WINDOW_MINUTES', 5),
  },
};
