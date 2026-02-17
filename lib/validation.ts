/**
 * Input Validation for Wallet Operations
 * Validates and sanitizes user inputs
 */

import { InvalidAmountError } from './errors'

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

  // Check for reasonable precision (max 2 decimal places)
  const decimalPlaces = (amount.toString().split('.')[1] || '').length
  if (decimalPlaces > 2) {
    throw new InvalidAmountError(amount)
  }
}

/**
 * Validate idempotency key format
 */
export function validateIdempotencyKey(key: string): void {
  if (!key || typeof key !== 'string' || key.length < 1 || key.length > 255) {
    throw new Error('Invalid idempotency key. Must be 1-255 characters.')
  }
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
  return input.trim().substring(0, maxLength)
}
