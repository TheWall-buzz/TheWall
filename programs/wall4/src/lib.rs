use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_master_edition_v3, create_metadata_accounts_v3, CreateMasterEditionV3,
        CreateMetadataAccountsV3, Metadata,
    },
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};
use mpl_token_metadata::{
    pda::{find_master_edition_account, find_metadata_account},
    state::{DataV2, Collection},
};
use solana_program::pubkey::Pubkey;
use std::str::FromStr;

declare_id!("2SjCg4NavpCbDikCZ6m7SJNtufMk8khAq8yMzJe2nA61");


#[program]
pub mod wall4 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let walls_registry = &mut ctx.accounts.walls_registry;
        Ok(())
    }

    pub fn add_wall(
        ctx: Context<WallStruct>,
        metadata_url: String
    ) -> Result<()> {
        let walls_registry = &mut ctx.accounts.walls_registry;
        if !walls_registry.walls.contains(&ctx.accounts.mint.key()) {
            walls_registry.walls.push(ctx.accounts.mint.key());
        }

        let current_item = format!("WALL #{}", walls_registry.walls.len());

        let meta_data = DataV2 {
            name: current_item,
            symbol: "WALL".to_string(),
            uri: metadata_url,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        //init_nft(ctx, meta_data);

        Ok(())
    }

    pub fn add_brick(
        ctx: Context<BrickStruct>,
        metadata_url: String
    ) -> Result<()> {
        let bricks_registry = &mut ctx.accounts.bricks_registry;
        if !bricks_registry.bricks.contains(&ctx.accounts.mint.key()) {
            bricks_registry.bricks.push(ctx.accounts.mint.key());
        }

        let walls_registry = &mut ctx.accounts.walls_registry;
        let current_item = format!("WALL #{}, BRICK #{}", walls_registry.walls.len(), bricks_registry.bricks.len());

        let meta_data = DataV2 {
            name: current_item,
            symbol: "BRICK".to_string(),
            uri: metadata_url,
            seller_fee_basis_points: 0,
            creators: None,
            //collection: Some(belongs_to),
            collection: Some(Collection {
                verified: false,
                key: ctx.accounts.wall_mint.key()
            }),
            uses: None,
        };

        //init_nft(ctx, meta_data);

        Ok(())
    }
}

pub fn init_nft(
    ctx: Context<InitNFT>,
    meta_data: DataV2
) -> Result<()> {

    // create mint account
    let cpi_context = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.associated_token_account.to_account_info(),
            authority: ctx.accounts.signer.to_account_info(),
        },
    );

    mint_to(cpi_context, 1)?;

    // create metadata account
    let cpi_context = CpiContext::new(
        ctx.accounts.token_metadata_program.to_account_info(),
        CreateMetadataAccountsV3 {
            metadata: ctx.accounts.metadata_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            mint_authority: ctx.accounts.signer.to_account_info(),
            update_authority: ctx.accounts.signer.to_account_info(),
            payer: ctx.accounts.signer.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        },
    );

    create_metadata_accounts_v3(cpi_context, meta_data, false, true, None)?;

    //create master edition account
    let cpi_context = CpiContext::new(
        ctx.accounts.token_metadata_program.to_account_info(),
        CreateMasterEditionV3 {
            edition: ctx.accounts.master_edition_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            update_authority: ctx.accounts.signer.to_account_info(),
            mint_authority: ctx.accounts.signer.to_account_info(),
            payer: ctx.accounts.signer.to_account_info(),
            metadata: ctx.accounts.metadata_account.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        },
    );

    create_master_edition_v3(cpi_context, None)?;

    Ok(())
}


#[derive(Accounts)]
pub struct InitNFT<'info> {
    /// CHECK: ok, we are passing in this account ourselves
    //#[account(mut, signer)]
    //pub signer: AccountInfo<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
    init,
    payer = signer,
    mint::decimals = 0,
    mint::authority = signer.key(),
    mint::freeze_authority = signer.key(),
    )]
    pub mint: Account<'info, Mint>,

    #[account(
    init_if_needed,
    payer = signer,
    associated_token::mint = mint,
    associated_token::authority = signer
    )]
    pub associated_token_account: Account<'info, TokenAccount>,
    /// CHECK - address
    #[account(
    mut,
    address=find_metadata_account(&mint.key()).0,
    )]
    pub metadata_account: AccountInfo<'info>,
    /// CHECK: address
    #[account(
    mut,
    address=find_master_edition_account(&mint.key()).0,
    )]
    pub master_edition_account: AccountInfo<'info>,

    #[account(mut, seeds = [b"walls_registry"], bump)]
    //#[account(init_if_needed, payer = signer, space = 8 + 32 * 100 + 8, seeds = [b"walls_registry"], bump, mut)]
    pub walls_registry: Account<'info, WallsRegistry>,

    // #[account(
    // init,
    // payer = signer,
    // seeds = [b"bricks_registry"],
    // bump,
    // space = 8 + 32 * 100 + 8 // Adjust the space as needed
    // )]
    // pub bricks_registry: Account<'info, NftRegistry>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
pub struct WallsRegistry {
    // List of walls NFTs
    pub walls: Vec<Pubkey>,
}

#[account]
pub struct BricksRegistry {
    // List of bricks NFTs
    pub bricks: Vec<Pubkey>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 32 * 100 + 8, seeds = [b"walls_registry"], bump)]
    pub walls_registry: Account<'info, WallsRegistry>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WallStruct<'info> {
    /// CHECK: ok, we are passing in this account ourselves
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
    init,
    payer = signer,
    mint::decimals = 0,
    mint::authority = signer.key(),
    mint::freeze_authority = signer.key(),
    )]
    pub mint: Account<'info, Mint>,

    //#[account(mut, seeds = [b"walls_registry"], bump)]
    #[account(init_if_needed, payer = signer, space = 8 + 32 * 100 + 8, seeds = [b"walls_registry"], bump)]
    pub walls_registry: Account<'info, WallsRegistry>,

    #[account(
    init,
    payer = signer,
    seeds = [b"bricks_registry", mint.key().as_ref()],
    bump,
    space = 8 + 32 * 100 + 8 // Adjust the space as needed
    )]
    pub bricks_registry: Account<'info, BricksRegistry>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct BrickStruct<'info> {
    /// CHECK: ok, we are passing in this account ourselves
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
    init,
    payer = signer,
    mint::decimals = 0,
    mint::authority = signer.key(),
    mint::freeze_authority = signer.key(),
    )]
    pub mint: Account<'info, Mint>,

    #[account(mut, seeds = [b"walls_registry"], bump)]
    pub walls_registry: Account<'info, WallsRegistry>,

    pub wall_mint: Account<'info, Mint>,

    #[account(
    mut,
    seeds = [b"bricks_registry", wall_mint.key().as_ref()],
    bump,
    )]
    pub bricks_registry: Account<'info, BricksRegistry>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
