'use client';

import { Keypair, PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { ellipsify } from '../ui/ui-layout';
import { ExplorerLink } from '../cluster/cluster-ui';
import {
  useWallProgram,
  useWallProgramAccount,
} from './wall-list-data-access';

export function WallCreate() {
  const { initialize } = useWallProgram();
  const defaultBricksCount = 4;

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
        onClick={() => {
            const value = window.prompt(
                'Set value to:',
                defaultBricksCount.toString()
            );
            if (
                !value || isNaN(parseInt(value))
            ) {
                return;
            }
            return initialize.mutateAsync(parseInt(value))
        }}

      disabled={initialize.isPending}
    >
      Create Wall {initialize.isPending && '...'}
    </button>
  );
}

export function WallList() {
  const { accounts, getProgramAccount , programId} = useWallProgram();

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>
          Program account not found. Make sure you have deployed the program and
          are on the correct cluster.
        </span>
      </div>
    );
  }

  return (
    <div className={'space-y-6'}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data && accounts.data[0].account.walls.map((account) => (
            <WallCard
              key={account.toString()}
              wallPublicKey={account}
            />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No Walls</h2>
          No walls found. Create one above to get started.
        </div>
      )}
    </div>
  );
}

function WallCard({ wallPublicKey }: { wallPublicKey: PublicKey }) {
  const { account, increment, set, decrement, close } =
    useWallProgramAccount({
      wallPublicKey,
    });

  return account.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4">
        <div className="card-body items-center text-center">
            <div className="space-y-6">
                <h2
                    className="card-title justify-center text-3xl cursor-pointer"
                    onClick={() => account.refetch()}
                >
                    WALL
                </h2>


            </div>
            <div className="text-center space-y-4 text-sm">
                <p>
                    <ExplorerLink
                        path={`account/${wallPublicKey}`}
                        label={ellipsify(wallPublicKey.toString())}
                    />
                </p>
                <div className="card-actions">
                    <div className="grid md:grid-cols-2 gap-4">
                        {account.data && account.data.bricks.map((brickPublicKey) => (
                            <BrickCard
                                key={brickPublicKey.toString()}
                                brickPublicKey={brickPublicKey}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}

function BrickCard({brickPublicKey}: { brickPublicKey: PublicKey }) {
    return (
        <div className="card card-bordered border-base-400 border-4 text-center"  style={{width: '300px'}}>
            <div>Brick</div>
            <ExplorerLink
                path={`account/${brickPublicKey}`}
                label={ellipsify(brickPublicKey.toString())}
            />
        </div>
    )

}