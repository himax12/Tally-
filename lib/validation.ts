/**
 * Input Validation for Wallet Operations
 * Validates and sanitizes user inputs
 */

import { InvalidAmountError } from './errors'
import { config } from './config'

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validate amount is positive number
 */
export function validateAmount(amount: number): void {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    throw new InvalidAmountError(amount)
  }

  // Check for reasonable precision
  const decimalPlaces = (amount.toString().split('.')[1] || '').length
  if (decimalPlaces > config.validation.maxDecimalPlaces) {
    throw new InvalidAmountError(amount)
  }
}

/**
 * Validate idempotency key format
 */
export function validateIdempotencyKey(key: string): void {
  if (
    !key || 
    typeof key !== 'string' || 
    key.length < config.validation.idempotencyKeyMinLength || 
    key.length > config.validation.idempotencyKeyMaxLength
  ) {
    throw new Error(`Invalid idempotency key. Must be ${config.validation.idempotencyKeyMinLength}-${config.validation.idempotencyKeyMaxLength} characters.`)
  }
}

/**
 * Sanitize string input
 */
export function sanitizeString(
  input: string, 
  maxLength: number = config.validation.maxStringLength
): string {
  return input.trim().substring(0, maxLength)
}
