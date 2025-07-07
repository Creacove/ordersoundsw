
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("8QJVBNGGbkR1xKYZZMqWvbPMDLZcGWfyN7KxYx1h8F3v");

#[program]
pub mod payment_splitter {
    use super::*;

    /// Initialize the platform configuration with the platform wallet address
    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        platform_wallet: Pubkey,
    ) -> Result<()> {
        let platform_config = &mut ctx.accounts.platform_config;
        platform_config.platform_wallet = platform_wallet;
        platform_config.platform_fee_basis_points = 2000; // 20% = 2000 basis points
        platform_config.authority = ctx.accounts.authority.key();
        
        msg!("Platform initialized with wallet: {}", platform_wallet);
        Ok(())
    }

    /// Process a split payment: 80% to producer, 20% to platform
    /// This function atomically transfers USDC with the required split
    pub fn process_split_payment(
        ctx: Context<ProcessSplitPayment>,
        amount: u64,
    ) -> Result<()> {
        let platform_config = &ctx.accounts.platform_config;
        
        // Validate amount is greater than 0
        require!(amount > 0, PaymentError::InvalidAmount);
        
        // Calculate split amounts
        let platform_fee = (amount as u128)
            .checked_mul(platform_config.platform_fee_basis_points as u128)
            .ok_or(PaymentError::CalculationOverflow)?
            .checked_div(10000)
            .ok_or(PaymentError::CalculationOverflow)? as u64;
            
        let producer_amount = amount
            .checked_sub(platform_fee)
            .ok_or(PaymentError::CalculationOverflow)?;
        
        msg!("Processing payment split - Total: {}, Platform: {}, Producer: {}", 
             amount, platform_fee, producer_amount);
        
        // Verify the payer has sufficient balance
        require!(
            ctx.accounts.payer_token_account.amount >= amount,
            PaymentError::InsufficientBalance
        );
        
        // Transfer platform fee to platform wallet
        if platform_fee > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.payer_token_account.to_account_info(),
                to: ctx.accounts.platform_token_account.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_ctx, platform_fee)?;
        }
        
        // Transfer producer amount to producer wallet
        if producer_amount > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.payer_token_account.to_account_info(),
                to: ctx.accounts.producer_token_account.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_ctx, producer_amount)?;
        }
        
        // Emit event for tracking
        emit!(PaymentProcessed {
            payer: ctx.accounts.payer.key(),
            producer: ctx.accounts.producer.key(),
            total_amount: amount,
            platform_fee,
            producer_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Payment split completed successfully");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + PlatformConfig::INIT_SPACE,
        seeds = [b"platform_config"],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProcessSplitPayment<'info> {
    #[account(
        seeds = [b"platform_config"],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// CHECK: Producer wallet address - validated by business logic
    pub producer: AccountInfo<'info>,
    
    #[account(
        mut,
        constraint = payer_token_account.owner == payer.key() @ PaymentError::InvalidTokenAccount,
        constraint = payer_token_account.mint == usdc_mint.key() @ PaymentError::InvalidMint
    )]
    pub payer_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = producer_token_account.owner == producer.key() @ PaymentError::InvalidTokenAccount,
        constraint = producer_token_account.mint == usdc_mint.key() @ PaymentError::InvalidMint
    )]
    pub producer_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = platform_token_account.owner == platform_config.platform_wallet @ PaymentError::InvalidTokenAccount,
        constraint = platform_token_account.mint == usdc_mint.key() @ PaymentError::InvalidMint
    )]
    pub platform_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: USDC mint address - validated by constraint
    pub usdc_mint: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct PlatformConfig {
    pub platform_wallet: Pubkey,
    pub platform_fee_basis_points: u16, // 2000 = 20%
    pub authority: Pubkey,
}

impl PlatformConfig {
    const INIT_SPACE: usize = 32 + 2 + 32; // pubkey + u16 + pubkey
}

#[event]
pub struct PaymentProcessed {
    pub payer: Pubkey,
    pub producer: Pubkey,
    pub total_amount: u64,
    pub platform_fee: u64,
    pub producer_amount: u64,
    pub timestamp: i64,
}

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
