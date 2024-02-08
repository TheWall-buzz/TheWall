'use client';

import {WallIDL, getWallProgramId} from '@thewall/anchor';
import {Program} from '@coral-xyz/anchor';
import {useConnection} from '@solana/wallet-adapter-react';
import {Cluster, Keypair, PublicKey} from '@solana/web3.js';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useMemo} from 'react';
import toast from 'react-hot-toast';
import {useCluster} from '../cluster/cluster-data-access';
import {useAnchorProvider} from '../solana/solana-provider';
import {useTransactionToast} from '../ui/ui-layout';
import * as anchor from "@coral-xyz/anchor";
import {ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {
    findMasterEditionPda,
    findMetadataPda,
    MPL_TOKEN_METADATA_PROGRAM_ID, mplTokenMetadata
} from "@metaplex-foundation/mpl-token-metadata";
import {publicKey} from "@metaplex-foundation/umi";
import {createUmi} from "@metaplex-foundation/umi-bundle-defaults";
import {walletAdapterIdentity} from "@metaplex-foundation/umi-signer-wallet-adapters";

export function useWallProgram() {
    const {connection} = useConnection();
    const {cluster} = useCluster();
    const transactionToast = useTransactionToast();
    const provider = useAnchorProvider();
    const programId = useMemo(
        () => getWallProgramId(cluster.network as Cluster),
        [cluster]
    );

    const program = new Program(WallIDL, programId, provider);

    //const umi = createUmi("https://api.devnet.solana.com")
    const umi = createUmi("https://127.0.0.1:8899")
        .use(walletAdapterIdentity(provider.wallet))
        .use(mplTokenMetadata());

    const accounts = useQuery({
        queryKey: ['counter', 'all', {cluster}],
        queryFn: () => program.account.wallsRegistry.all()
    });

    const getProgramAccount = useQuery({
        queryKey: ['get-program-account', {cluster}],
        queryFn: () => connection.getParsedAccountInfo(programId),
    });

    const initialize = useMutation({
        mutationKey: ['wall', 'sendTxBatch', {cluster}],
        mutationFn: (bricksCount: Number) => sendTxBatch(program, provider.wallet, provider, umi, bricksCount),
        onSuccess: (signature) => {
            transactionToast(signature);
            return accounts.refetch();
        },
        onError: () => toast.error('Failed to send transaction batch'),
    });

    return {
        program,
        programId,
        accounts,
        getProgramAccount,
        initialize,
    };
}

export function useWallProgramAccount({wallPublicKey}: { wallPublicKey: PublicKey }) {
    const {cluster} = useCluster();
    const transactionToast = useTransactionToast();
    const {program, accounts, programId} = useWallProgram();

    const [bricksRegistryAccount, _bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("bricks_registry"), wallPublicKey.toBuffer()],
        programId
    );

    const account = useQuery({
        queryKey: ['counter', 'fetch', {cluster, bricksRegistryAccount}],
        queryFn: () => program.account.bricksRegistry.fetch(bricksRegistryAccount),
    });

    return {
        account,
        close
    };
}

async function getWallTx(program, signer, provider, umi, mint) {

    const programId = program.programId;

    const [wallsRegistry, _bump] = await PublicKey.findProgramAddress(
        [Buffer.from("walls_registry")],
        programId
    );

    const [bricksRegistry, _bump2] = await PublicKey.findProgramAddress(
        [Buffer.from("bricks_registry"), mint.publicKey.toBuffer()],
        programId
    );

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

    const metadata_url = "https://viviparty.s3.amazonaws.com/metadata.json";

    const tx = await program.methods
        .addWall(metadata_url)
        .accounts({
            signer: provider.publicKey,
            mint: mint.publicKey,
            //associatedTokenAccount,
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
        .transaction();

    return [tx, mint];
}

async function getBrickTx(program, signer, provider, umi, brickMint, wallMint) {
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
            //associatedTokenAccount,
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
        .transaction();
    return [tx, brickMint];
}


async function sendTxBatch(program, signer, provider, umi, bricksAmount) {
    const wallMint = anchor.web3.Keypair.generate();
    const txList = []
    const [tx, mint] = await getWallTx(program, signer, provider, umi, wallMint);
    txList.push({tx: tx, signers: [mint]})
    for (let i = 0; i < bricksAmount; i++) {
        const brickMint = anchor.web3.Keypair.generate();
        const [tx, mint] = await getBrickTx(program, signer, provider, umi, brickMint, wallMint);
        txList.push({tx: tx, signers: [mint]})
    }

    try {
        const txSigs = await provider.sendAll(txList);
        console.log("Transactions sent with signatures:", txSigs.map(txSig => txSig.signature));
    } catch (error) {
        console.error("Error sending transactions:", error);
    }
}


