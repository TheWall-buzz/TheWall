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

declare_id!("Ae3cdutffNw6Yj5DxWYXffJW5PegtCxJUjTLfUp1Mm3J");


#[program]
pub mod wall4 {
    use super::*;

    // pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    //     Ok(())
    // }

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let nft_registry = &mut ctx.accounts.nft_registry;
        nft_registry.count = 0; // Initialize counter to 0.
        Ok(())
    }

    pub fn add_wall(
        ctx: Context<InitNFT>,
        name: String,
        symbol: String,
        uri: String
    ) -> Result<()> {

        let data_v2 = DataV2 {
            name: name,
            symbol: symbol,
            uri: uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        return init_nft(
            ctx,
            data_v2
        );
    }

    pub fn add_brick(
        ctx: Context<InitNFT>,
        name: String,
        symbol: String,
        uri: String,
        wall_pub_key: String
    ) -> Result<()> {

        let data_v2 = DataV2 {
            name: name,
            symbol: symbol,
            uri: uri,
            seller_fee_basis_points: 0,
            creators: None,
            //collection: Some(belongs_to),
            collection: Some(Collection {
                verified: false,
                key: Pubkey::from_str(wall_pub_key.as_str()).unwrap()
            }),
            uses: None,
        };

        return init_nft(
            ctx,
            data_v2
        );
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

    let nft_registry = &mut ctx.accounts.nft_registry;

    // Ensure the NFT is not already registered.
    if !nft_registry.nfts.contains(&ctx.accounts.mint.key()) {
        // Add the NFT to the registry.
        nft_registry.nfts.push(ctx.accounts.mint.key());
        nft_registry.count += 1;
    }

    Ok(())
}

// #[derive(Accounts)]
// pub struct Initialize<'info> {
//     /// CHECK: ok, we are passing in this account ourselves
//     #[account(mut, signer)]
//     pub signer: AccountInfo<'info>,
//
//     #[account(
//     init,
//     seeds = [b"nft_registry"],
//     bump,
//     payer = signer,
//     space = 8 + 32 * 100 + 8
//     )]
//     pub registry: Account<'info, NftRegistry>,
//
//     // #[account(mut)]
//     // pub user: Signer<'info>,
//
//     pub system_program: Program<'info, System>,
// }

#[derive(Accounts)]
pub struct InitNFT<'info> {
    /// CHECK: ok, we are passing in this account ourselves
    #[account(mut, signer)]
    pub signer: AccountInfo<'info>,
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

    #[account(mut, seeds = [b"nft_registry"], bump)]
    pub nft_registry: Account<'info, NftRegistry>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// #[account]
// pub struct NftRegistry {
//     // The list of NFT mint addresses.
//     pub nfts: Vec<Pubkey>,
//     // Number of NFTs registered.
//     pub count: u64,
// }

#[account]
pub struct NftRegistry {
    // The list of NFT mint addresses.
    pub nfts: Vec<Pubkey>,
    // Number of NFTs registered.
    pub count: u64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 32 * 100 + 8, seeds = [b"nft_registry"], bump)]
    pub nft_registry: Account<'info, NftRegistry>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}