use anchor_lang::prelude::*;

declare_id!("BX9L6J7pVq5QAGREr3adW63uVThdQ3VqJp9BnuwmjGNx");

#[program]
pub mod wall4 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

