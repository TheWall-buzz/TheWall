// Here we export some useful types and functions for interacting with the Anchor program.
import { Cluster, PublicKey } from '@solana/web3.js';
import type { Wall4 } from '../target/types/wall4';
import { IDL as WallIDL } from '../target/types/wall4';
import { Program } from '@coral-xyz/anchor';


export {Wall4, WallIDL}
export type WallProgram = Program<Wall4>;

// After updating your program ID (e.g. after running `anchor keys sync`) update the value below.
export const WALL_PROGRAM_ID = new PublicKey(
    '2SjCg4NavpCbDikCZ6m7SJNtufMk8khAq8yMzJe2nA61'
);

export function getWallProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
    case 'mainnet-beta':
      // You only need to update this if you deploy your program on one of these clusters.
      return WALL_PROGRAM_ID;
    default:
      return WALL_PROGRAM_ID;
  }
}
