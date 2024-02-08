'use client';

import { WallIDL, getWallProgramId } from '@thewall/anchor';
import { Program } from '@coral-xyz/anchor';
import { useConnection } from '@solana/wallet-adapter-react';
import { Cluster, Keypair, PublicKey } from '@solana/web3.js';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { useCluster } from '../cluster/cluster-data-access';
import { useAnchorProvider } from '../solana/solana-provider';
import { useTransactionToast } from '../ui/ui-layout';
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
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const programId = useMemo(
    () => getWallProgramId(cluster.network as Cluster),
    [cluster]
  );

  const program = new Program(WallIDL, programId, provider);

  const umi = createUmi("https://api.devnet.solana.com")
      .use(walletAdapterIdentity(provider.wallet))
      .use(mplTokenMetadata());

  const accounts = useQuery({
    queryKey: ['counter', 'all', { cluster }],
    queryFn: () => program.account.nftRegistry.all(),
  });

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  const initialize = useMutation({
    mutationKey: ['wall', 'initialize', { cluster }],
    //mutationFn: (keypair: Keypair) => addWall(program, provider.wallet, provider, umi),
    mutationFn: (keypair: Keypair) => sendBatch(program, provider.wallet, provider, umi, 3),
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error('Failed to initialize counter'),
  });

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  };
}

export function useWallProgramAccount({ counter }: { counter: PublicKey }) {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts } = useWallProgram();

  const account = useQuery({
    queryKey: ['counter', 'fetch', { cluster, counter }],
    queryFn: () => program.account.counter.fetch(counter),
  });

  const close = useMutation({
    mutationKey: ['counter', 'close', { cluster, counter }],
    mutationFn: () =>
      program.methods.closeCounter().accounts({ counter }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return accounts.refetch();
    },
  });

  const decrement = useMutation({
    mutationKey: ['counter', 'decrement', { cluster, counter }],
    mutationFn: () => program.methods.decrement().accounts({ counter }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return account.refetch();
    },
  });

  const increment = useMutation({
    mutationKey: ['counter', 'increment', { cluster, counter }],
    mutationFn: () => program.methods.increment().accounts({ counter }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return account.refetch();
    },
  });

  const set = useMutation({
    mutationKey: ['counter', 'set', { cluster, counter }],
    mutationFn: (value: number) =>
      program.methods.set(value).accounts({ counter }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return account.refetch();
    },
  });

  return {
    account,
    close,
    decrement,
    increment,
    set,
  };
}

async function getWallTx(program, signer, provider, umi, mint) {
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
  const [nftRegistry, _bump] = await PublicKey.findProgramAddress(
      [Buffer.from("nft_registry")],
      programId
  );

  const tx = await program.methods
      .addWall(metadata.name, metadata.symbol, metadata.uri)
      .accounts({
        signer: provider.publicKey,
        mint: mint.publicKey,
        associatedTokenAccount,
        metadataAccount,
        masterEditionAccount,
        nftRegistry,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
      })
      .signers([mint])
      .transaction()

  return [tx, mint];
      //.rpc();

  // console.log(
  //     `Wall mint nft tx: https://explorer.solana.com/tx/${tx}?cluster=devnet`
  // );
  // console.log(
  //     `Wall minted nft: https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`
  // );
  // return mint.publicKey.toString();
}

async function getBrickTx(program, signer, provider, umi, wallPubKey) {
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
  const [nftRegistryAccount, _bump] = await PublicKey.findProgramAddress(
      [Buffer.from("nft_registry")],
      programId
  );

  const tx = await program.methods
      //.addBrick(metadata.name, metadata.symbol, metadata.uri, wallPubKey)
      .addWall(metadata.name, metadata.symbol, metadata.uri)
      .accounts({
        signer: provider.publicKey,
        mint: mint.publicKey,
        associatedTokenAccount,
        metadataAccount,
        masterEditionAccount,
        nftRegistry: nftRegistryAccount,
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

async function sendBatch(program, signer, provider, umi, bricksAmount) {
  const wallMint = anchor.web3.Keypair.generate(); // Wall mint
  const txList = []
  const [tx, mint] = await getWallTx(program, signer, provider, umi, wallMint);
  txList.push({ tx: tx, signers: [mint] })
  for (let i = 0; i < bricksAmount; i++) {
    const [tx, mint] = await getBrickTx(program, signer, provider, umi, wallMint.publicKey.toString());
    txList.push({ tx: tx, signers: [mint] })
  }

  try {
    const txSigs = await provider.sendAll(txList);
    console.log("Transactions sent with signatures:", txSigs.map(txSig => txSig.signature));
  } catch (error) {
    console.error("Error sending transactions:", error);
  }
}

async function fetchNftRegistry(program, nftRegistryPubkey: PublicKey) {
  const nftRegistryAccount = await program.account.nftRegistry.fetch(nftRegistryPubkey);
  console.log("NFTs Registered:", nftRegistryAccount.count.toString());
  console.log("NFT Mint Addresses:");
  nftRegistryAccount.nfts.forEach((mintAddress: PublicKey, index: number) => {
    console.log(`${index + 1}: ${mintAddress.toBase58()}`);
  });
}
