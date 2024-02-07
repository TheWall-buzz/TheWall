'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '../solana/solana-provider';
import { AppHero, ellipsify } from '../ui/ui-layout';
import { ExplorerLink } from '../cluster/cluster-ui';
import { useWallProgram } from './wall-list-data-access';
import { WallCreate, WallList } from './wall-list-ui';

export default function WallListFeature() {
  const { publicKey } = useWallet();
  const { programId } = useWallProgram();

  return publicKey ? (
    <div>
      <AppHero
        title="The Wall"
        subtitle={
          'You can create a new wall by clicking the "Create" button.'
        }
      >
        <p className="mb-6">
          <ExplorerLink
            path={`account/${programId}`}
            label={ellipsify(programId.toString())}
          />
        </p>
        <WallCreate />
      </AppHero>
      <WallList />
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  );
}
