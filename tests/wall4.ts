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

//const PROGRAM_ID = new PublicKey("A1xNh9dQmKmuyJHvdwVnSpMJWia1f4hF1Wb2DEMG9D5U");


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

describe("solana-nft-anchor", async () => {
    // Configured the client to use the devnet cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Wall4 as Program<Wall4>;

    const signer = provider.wallet;

    //const umi = createUmi("http://127.0.0.1:8899")
    const umi = createUmi("https://api.devnet.solana.com")
        .use(walletAdapterIdentity(signer))
        .use(mplTokenMetadata());


//     it("prints", async() => {
//
//         // Function to find the Metadata PDA for a given mint address
//         async function findMetadataPda2(mintAddress: PublicKey): Promise<PublicKey> {
//             return PublicKey.findProgramAddress(
//                 [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), mintAddress.toBuffer()],
//                 METADATA_PROGRAM_ID
//             ).then(([pda]) => pda);
//         }
//
// // Function to fetch and parse the metadata for a given mint address
//         async function fetchNftMetadata(mintAddress: string) {
//             const mintPublicKey = new PublicKey(mintAddress);
//             let metadataAccount = findMetadataPda(umi, {
//                 mint: publicKey(mintPublicKey),
//             })[0];
//
//             const metadata = await fetchMetadata(umi, metadataAccount);
//
//             // Output the metadata
//             console.log("NFT Metadata3:", metadata);
//         }
//         async function fetchAllSPLTokens(walletAddress: string, rpcUrl: string = "https://api.devnet.solana.com") {
//             const connection = new Connection(rpcUrl, "confirmed");
//             const walletPublicKey = new PublicKey(walletAddress);
//
//             // Get all token accounts for the wallet by owner
//             const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPublicKey, { programId: TOKEN_PROGRAM_ID });
//
//             // Display token account details
//             tokenAccounts.value.forEach(accountInfo => {
//                 const accountData = accountInfo.account.data.parsed;
//                 console.log(`Token Account Address: ${accountInfo.pubkey.toString()}`);
//                 console.log(`Token Account Balance: ${accountData.info.tokenAmount.uiAmount}`);
//                 console.log(`Mint Address: ${accountData.info.mint}`);
//                 fetchNftMetadata(accountData.info.mint);
//                 console.log('---------------------------------------------');
//             });
//
//         }
//
// // Example usage
//         const walletAddress = "4siwryZZU7EaTJWBcsbzaff6pdEE9c3RLrntHNBHnVYT";
//         fetchAllSPLTokens(walletAddress);
//     })

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

    async function testWallCall(program, signer, provider, umi, mint) {
        const programId = program.programId;

        // Generate the PDA used in the smart contract.
        const [wallsRegistryAccount, _bump] = await PublicKey.findProgramAddress(
            [Buffer.from("walls_registry")],
            programId
        );

        const [bricksRegistry, _bump2] = await PublicKey.findProgramAddress(
            [Buffer.from("bricks_registry"), mint.publicKey.toBuffer()],
            programId
        );

        const tx = await program.methods
            .testWall()
            .accounts({
                signer: provider.publicKey,
                mint: mint.publicKey,
                wallsRegistry: wallsRegistryAccount,
                bricksRegistry,
                tokenProgram: TOKEN_PROGRAM_ID,
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
    }

    async function testBrickCall(program, signer, provider, umi, brickMint, wallMint) {
        const programId = program.programId;

        const [bricksRegistry, _bump2] = await PublicKey.findProgramAddress(
            [Buffer.from("bricks_registry"), wallMint.publicKey.toBuffer()],
            programId
        );

        const tx = await program.methods
            .testBricks()
            .accounts({
                signer: provider.publicKey,
                mint: brickMint.publicKey,
                wallMint: wallMint.publicKey,
                bricksRegistry,
                tokenProgram: TOKEN_PROGRAM_ID,
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

    it("mints nft!", async () => {
        //await initialize(program, signer, provider, umi);

        // const wallMint1 = anchor.web3.Keypair.generate(); // Wall mint
        // await testWallCall(program, signer, provider, umi, wallMint1);
        //
        // const brickMint = anchor.web3.Keypair.generate(); // Wall mint
        // await testBrickCall(program, signer, provider, umi, brickMint, wallMint1);
        // const brickMint2 = anchor.web3.Keypair.generate(); // Wall mint
        // await testBrickCall(program, signer, provider, umi, brickMint2, wallMint1);
        //
        // const wallMint2 = anchor.web3.Keypair.generate(); // Wall mint
        // await testWallCall(program, signer, provider, umi, wallMint2);

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

    // it("gets nfts", async () => {
    //     async function fetchNftRegistry() {
    //         const programId = program.programId;
    //
    //         const [nftRegistryPubkey, _bump] = await PublicKey.findProgramAddress(
    //             [Buffer.from("nft_registry")],
    //             programId
    //         );
    //
    //         const nftRegistryAccount = await program.account.nftRegistry.fetch(nftRegistryPubkey);
    //         console.log("NFTs Registered:", nftRegistryAccount.count.toString());
    //         console.log("NFT Mint Addresses:");
    //         let result = [];
    //         nftRegistryAccount.nfts.forEach((mintAddress: PublicKey, index: number) => {
    //             console.log(`${index + 1}: ${mintAddress.toBase58()}`);
    //         });
    //     }
    //
    //     fetchNftRegistry().catch(console.error);
    // });


});