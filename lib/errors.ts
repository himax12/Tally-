/**
 * Custom Error Classes for Wallet System
 * These provide specific error types for different failure scenarios
 */

export class WalletError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WalletError'
  }
}

export class InsufficientBalanceError extends WalletError {
  constructor(
    public walletId: string,
    public requestedAmount: number,
    public availableBalance: number
  ) {
    super(
      `Insufficient balance. Requested: ${requestedAmount}, Available: ${availableBalance}`
    )
    this.name = 'InsufficientBalanceError'
  }
}

export class WalletNotFoundError extends WalletError {
  constructor(public userId: string, public assetTypeId: string) {
    super(`Wallet not found for user ${userId} and asset type ${assetTypeId}`)
    this.name = 'WalletNotFoundError'
  }
}

export class SystemWalletNotFoundError extends WalletError {
  constructor(public assetTypeId: string) {
    super(`System wallet not found for asset type ${assetTypeId}`)
    this.name = 'SystemWalletNotFoundError'
  }
}

export class InvalidAmountError extends WalletError {
  constructor(public amount: number) {
    super(`Invalid amount: ${amount}. Amount must be positive.`)
    this.name = 'InvalidAmountError'
  }
}

export class DuplicateTransactionError extends WalletError {
  constructor(public referenceId: string) {
    super(`Transaction with reference ID ${referenceId} already exists`)
    this.name = 'DuplicateTransactionError'
  }
}

export class TransactionFailedError extends WalletError {
  constructor(message: string, public cause?: Error) {
    super(message)
    this.name = 'TransactionFailedError'
  }
}
