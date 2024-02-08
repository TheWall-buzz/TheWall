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
    mutationFn: (keypair: Keypair) => addWall(program, provider.wallet, provider, umi),
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

async function addWall(program, signer, provider, umi) {
  const metadata = {
    name: "Wall #1",
    symbol: "WALL",
    uri: "https://viviparty.s3.amazonaws.com/metadata.json",
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

  const tx = await program.methods
      .addWall(metadata.name, metadata.symbol, metadata.uri)
      .accounts({
        signer: provider.publicKey,
        mint: mint.publicKey,
        associatedTokenAccount,
        metadataAccount,
        masterEditionAccount,
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
  return mint.publicKey.toString();
}

async function fetchNftRegistry(program, nftRegistryPubkey: PublicKey) {
  const nftRegistryAccount = await program.account.nftRegistry.fetch(nftRegistryPubkey);
  console.log("NFTs Registered:", nftRegistryAccount.count.toString());
  console.log("NFT Mint Addresses:");
  nftRegistryAccount.nfts.forEach((mintAddress: PublicKey, index: number) => {
    console.log(`${index + 1}: ${mintAddress.toBase58()}`);
  });
}
