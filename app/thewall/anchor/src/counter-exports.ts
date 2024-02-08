// Here we export some useful types and functions for interacting with the Anchor program.
import { Cluster, PublicKey } from '@solana/web3.js';
import type { Counter } from '../target/types/counter';
import type { Wall4 } from '../target/types/wall4';
import { IDL as CounterIDL } from '../target/types/counter';
import { IDL as WallIDL } from '../target/types/wall4';
import { Program } from '@coral-xyz/anchor';

// Re-export the generated IDL and type
export { Counter, CounterIDL };
export type CounterProgram = Program<Counter>;

export {Wall4, WallIDL}
export type WallProgram = Program<Wall4>;

// After updating your program ID (e.g. after running `anchor keys sync`) update the value below.
export const COUNTER_PROGRAM_ID = new PublicKey(
  'DRhYJPdvfE1m1r3nxUhVzWNWoi9VRTYZJZZvDRDfHTmh'
);

export const WALL_PROGRAM_ID = new PublicKey(
    '2SjCg4NavpCbDikCZ6m7SJNtufMk8khAq8yMzJe2nA61'
);

// This is a helper function to get the program ID for the Counter program depending on the cluster.
export function getCounterProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
    case 'mainnet-beta':
      // You only need to update this if you deploy your program on one of these clusters.
      return COUNTER_PROGRAM_ID;
    default:
      return COUNTER_PROGRAM_ID;
  }
}

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
