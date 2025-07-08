
use anchor_lang::prelude::*;

#[error_code]
pub enum PaymentError {
    #[msg("Invalid payment amount - must be greater than 0")]
    InvalidAmount,
    #[msg("Insufficient balance for payment")]
    InsufficientBalance,
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    #[msg("Invalid mint address")]
    InvalidMint,
    #[msg("Calculation overflow")]
    CalculationOverflow,
}
