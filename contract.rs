use anchor_lang::prelude::*;

declare_id!("AGjZLmcGfE3GSgowT8bKCkJ49ipG5qinKk59ahJ61bk9");

#[program]
pub mod bonding_curve {
    use super::*;

    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        total_supply: u64,
        virtual_sol_reserve: u64,
        virtual_token_reserve: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.owner = *ctx.accounts.owner.key;
        pool.total_supply = total_supply;
        pool.virtual_sol_reserve = virtual_sol_reserve;
        pool.virtual_token_reserve = virtual_token_reserve;
        pool.supply_remaining = total_supply;
        Ok(())
    }

    pub fn buy_tokens(ctx: Context<UpdatePool>, sol_in: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        // Price formula: Δtoken = (Δsol * virtual_token_reserve) / (virtual_sol_reserve + Δsol)
        let tokens_out = (sol_in as u128)
            .checked_mul(pool.virtual_token_reserve as u128)
            .unwrap()
            / (pool.virtual_sol_reserve as u128 + sol_in as u128);

        require!(tokens_out > 0, CustomError::InvalidAmount);

        pool.virtual_sol_reserve += sol_in;
        pool.virtual_token_reserve = pool
            .virtual_token_reserve
            .checked_sub(tokens_out as u64)
            .unwrap();
        pool.supply_remaining = pool
            .supply_remaining
            .checked_sub(tokens_out as u64)
            .unwrap();

        msg!("Bought {} tokens for {} lamports", tokens_out, sol_in);

        Ok(())
    }

    pub fn sell_tokens(ctx: Context<UpdatePool>, tokens_in: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        // Price formula: Δsol = (Δtoken * virtual_sol_reserve) / (virtual_token_reserve + Δtoken)
        let sol_out = (tokens_in as u128)
            .checked_mul(pool.virtual_sol_reserve as u128)
            .unwrap()
            / (pool.virtual_token_reserve as u128 + tokens_in as u128);

        require!(sol_out > 0, CustomError::InvalidAmount);

        pool.virtual_token_reserve += tokens_in;
        pool.virtual_sol_reserve = pool
            .virtual_sol_reserve
            .checked_sub(sol_out as u64)
            .unwrap();
        pool.supply_remaining = pool.supply_remaining.checked_add(tokens_in).unwrap();

        msg!("Sold {} tokens for {} lamports", tokens_in, sol_out);

        Ok(())
    }

    pub fn close_pool(ctx: Context<ClosePool>) -> Result<()> {
        // Anchor sẽ tự động đóng account pool và hoàn trả lamports về cho owner
        msg!("Pool closed by owner: {}", ctx.accounts.owner.key());
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(init, payer = owner, space = 8 + Pool::LEN)]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePool<'info> {
    #[account(mut, has_one = owner)]
    pub pool: Account<'info, Pool>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClosePool<'info> {
    #[account(mut, has_one = owner, close = owner)]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[account]
pub struct Pool {
    pub owner: Pubkey,
    pub total_supply: u64,
    pub supply_remaining: u64,
    pub virtual_sol_reserve: u64,
    pub virtual_token_reserve: u64,
}

impl Pool {
    pub const LEN: usize = 32 + 8 + 8 + 8 + 8;
}

#[error_code]
pub enum CustomError {
    #[msg("Invalid amount")]
    InvalidAmount,
}
