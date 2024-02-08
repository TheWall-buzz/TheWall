import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {Wall4} from "../target/types/wall4";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import {
    findMasterEditionPda,
    findMetadataPda,
    mplTokenMetadata,
    MPL_TOKEN_METADATA_PROGRAM_ID, collect,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";

import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { Metadata ,deserializeMetadata, fetchMetadata } from '@metaplex-foundation/mpl-token-metadata';


import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const PROGRAM_ID = new PublicKey("2SjCg4NavpCbDikCZ6m7SJNtufMk8khAq8yMzJe2nA61");


const METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

async function addWall(program, signer, provider, umi, mint) {
    const metadata = {
        name: "Wall #1",
        symbol: "WALL",
        uri: "https://viviparty.s3.amazonaws.com/metadata.json",
    };

    // Derive the associated token address account for the mint
    const associatedTokenAccount = await getAssociatedTokenAddress(
        mint.publicKey,
        signer.publicKey
    );

    // derive the metadata account
    let metadataAccount = findMetadataPda(umi, {
        mint: publicKey(mint.publicKey),
    })[0];

    //derive the master edition pda
    let masterEditionAccount = findMasterEditionPda(umi, {
        mint: publicKey(mint.publicKey),
    })[0];

    const programId = program.programId;

    // Generate the PDA used in the smart contract.
    const [nftRegistryAccount, _bump] = await PublicKey.findProgramAddress(
        [Buffer.from("nft_registry")],
        programId
    );

    // const [bricksRegistry, _bump2] = await PublicKey.findProgramAddress(
    //     [Buffer.from("bricks_registry")],
    //     programId
    // );

    const tx = await program.methods
        .addWall(metadata.name, metadata.symbol, metadata.uri)
        .accounts({
            signer: provider.publicKey,
            mint: mint.publicKey,
            associatedTokenAccount,
            metadataAccount,
            masterEditionAccount,
            nftRegistry: nftRegistryAccount,
            //bricksRegistry,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
        })
        .signers([mint])
        .rpc();

    console.log(
        `Wall mint nft tx: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );
    console.log(
        `Wall minted nft: https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`
    );
    //return mint.publicKey.toString();
}

async function addBrick(program, signer, provider, umi, wallPubKey: anchor.web3.PublicKey) {
    const metadata = {
        name: "Brick of the Wall #1",
        symbol: "BRICK",
        uri: "https://viviparty.s3.amazonaws.com/wall1brick1/metadata.json",
    };

    const mint = anchor.web3.Keypair.generate();

    // Derive the associated token address account for the mint
    const associatedTokenAccount = await getAssociatedTokenAddress(
        mint.publicKey,
        signer.publicKey
    );

    // derive the metadata account
    let metadataAccount = findMetadataPda(umi, {
        mint: publicKey(mint.publicKey),
    })[0];

    //derive the master edition pda
    let masterEditionAccount = findMasterEditionPda(umi, {
        mint: publicKey(mint.publicKey),
    })[0];

    const programId = program.programId;

    // Generate the PDA used in the smart contract.
    // const [nftRegistryAccount, _bump] = await PublicKey.findProgramAddress(
    //     [Buffer.from("nft_registry")],
    //     programId
    // );
    const bricksRegistry = (await PublicKey.findProgramAddress(
        [Buffer.from("bricks_registry"), wallPubKey.toBuffer()],
        programId
    ))[0];


    const tx = await program.methods
        .addBrick(metadata.name, metadata.symbol, metadata.uri, wallPubKey.toString())
        .accounts({
            signer: provider.publicKey,
            mint: mint.publicKey,
            associatedTokenAccount,
            metadataAccount,
            masterEditionAccount,
            wallMint: wallPubKey,
            bricksRegistry,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
        })
        .signers([mint])
        .rpc();

    console.log(
        `Brick mint nft tx: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );
    console.log(
        `Brick minted nft: https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`
    );
    return mint.publicKey;
}

describe("TheWall", async () => {
    // Configured the client to use the devnet cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Wall4 as Program<Wall4>;

    const signer = provider.wallet;

    const umi = createUmi("http://127.0.0.1:8899")
    //const umi = createUmi("https://api.devnet.solana.com")
        .use(walletAdapterIdentity(signer))
        .use(mplTokenMetadata());


    async function initialize(program, signer, provider, umi) {
        const programId = program.programId;
        // Generate the PDA used in the smart contract.
        const [wallsRegistry, _bump] = await PublicKey.findProgramAddress(
            [Buffer.from("walls_registry")],
            programId
        );

        await program.rpc.initialize({
            accounts: {
                wallsRegistry,
                user: program.provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
            },
        });
    }

    async function addWallCall(program, signer, provider, umi, mint) {
        const programId = program.programId;

        // Derive the associated token address account for the mint
        const associatedTokenAccount = await getAssociatedTokenAddress(
            mint.publicKey,
            signer.publicKey
        );

        // derive the metadata account
        let metadataAccount = findMetadataPda(umi, {
            mint: publicKey(mint.publicKey),
        })[0];

        //derive the master edition pda
        let masterEditionAccount = findMasterEditionPda(umi, {
            mint: publicKey(mint.publicKey),
        })[0];


        const [wallsRegistry, _bump] = await PublicKey.findProgramAddress(
            [Buffer.from("walls_registry")],
            programId
        );

        const [bricksRegistry, _bump2] = await PublicKey.findProgramAddress(
            [Buffer.from("bricks_registry"), mint.publicKey.toBuffer()],
            programId
        );

        const metadata_url = "https://viviparty.s3.amazonaws.com/metadata.json";

        const tx = await program.methods
            .addWall(metadata_url)
            .accounts({
                signer: provider.publicKey,
                mint: mint.publicKey,
                associatedTokenAccount,
                metadataAccount,
                masterEditionAccount,
                wallsRegistry,
                bricksRegistry,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY
            })
            .signers([mint])
            .rpc({
                skipPreflight: true,
                preflightCommitment: "confirmed" // Or another commitment level as needed
            });

        console.log(
            `Wall mint nft tx: https://explorer.solana.com/tx/${tx}?cluster=devnet`
        );
        console.log(
            `Wall minted nft: https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`
        );
    }

    async function addBrickCall(program, signer, provider, umi, brickMint, wallMint) {
        const programId = program.programId;

        const [wallsRegistry, _bump] = await PublicKey.findProgramAddress(
            [Buffer.from("walls_registry")],
            programId
        );

        const [bricksRegistry, _bump2] = await PublicKey.findProgramAddress(
            [Buffer.from("bricks_registry"), wallMint.publicKey.toBuffer()],
            programId
        );

        // Derive the associated token address account for the mint
        const associatedTokenAccount = await getAssociatedTokenAddress(
            brickMint.publicKey,
            signer.publicKey
        );

        // derive the metadata account
        let metadataAccount = findMetadataPda(umi, {
            mint: publicKey(brickMint.publicKey),
        })[0];

        //derive the master edition pda
        let masterEditionAccount = findMasterEditionPda(umi, {
            mint: publicKey(brickMint.publicKey),
        })[0];

        const metadata_url = "https://viviparty.s3.amazonaws.com/metadata.json";

        const tx = await program.methods
            .addBrick(metadata_url)
            .accounts({
                signer: provider.publicKey,
                mint: brickMint.publicKey,
                wallMint: wallMint.publicKey,
                associatedTokenAccount,
                metadataAccount,
                masterEditionAccount,
                wallsRegistry,
                bricksRegistry,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY
            })
            .signers([brickMint])
            .rpc();

        console.log(
            `Brick mint nft tx: https://explorer.solana.com/tx/${tx}?cluster=devnet`
        );
        console.log(
            `Brick minted nft: https://explorer.solana.com/address/${brickMint.publicKey}?cluster=devnet`
        );
    }

    it("mints walls and bricks!", async () => {
        //await initialize(program, signer, provider, umi);

        console.log("programId", program.programId.toString());

        const wallMint1 = anchor.web3.Keypair.generate(); // Wall mint
        await addWallCall(program, signer, provider, umi, wallMint1);

        const brickMint = anchor.web3.Keypair.generate(); // Wall mint
        await addBrickCall(program, signer, provider, umi, brickMint, wallMint1);
        const brickMint2 = anchor.web3.Keypair.generate(); // Wall mint
        await addBrickCall(program, signer, provider, umi, brickMint2, wallMint1);

        const wallMint2 = anchor.web3.Keypair.generate(); // Wall mint
        await addWallCall(program, signer, provider, umi, wallMint2);

        const programId = program.programId;

        const [wallsRegistryAccount, _bump] = await PublicKey.findProgramAddress(
            [Buffer.from("walls_registry")],
            programId
        );
        const wallsRegistry = await program.account.wallsRegistry.fetch(wallsRegistryAccount);


        for (const wallMint of wallsRegistry.walls) {
            console.log(`Wall: ${wallMint.toBase58()}`);

            const [brickRegPDA, _bump2] = await PublicKey.findProgramAddress(
                [Buffer.from("bricks_registry"), wallMint.toBuffer()],
                programId
            );
            console.log(brickRegPDA.toString());
            const bricksAccount = await program.account.bricksRegistry.fetch(brickRegPDA);
            for (const brickMint of bricksAccount.bricks) {
                console.log(`Brick: ${brickMint.toBase58()}`);
            }

        }
        console.log("------");

    });

});