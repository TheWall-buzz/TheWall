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

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => initialize.mutateAsync(Keypair.generate())}
      disabled={initialize.isPending}
    >
      Create {initialize.isPending && '...'}
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

  // const [wallsRegistryAccount, _bump] = PublicKey.findProgramAddressSync(
  //     [Buffer.from("walls_registry")],
  //     programId
  // );
  // console.log(wallsRegistryAccount);
  // //const wallsRegistry = await program.account.wallsRegistry.fetch(wallsRegistryAccount);
  //

  //debugger
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
    <div className="card card-bordered border-base-300 border-4 text-neutral-content">
      <div className="card-body items-center text-center">
        <div className="space-y-6">
          <h2
              className="card-title justify-center text-3xl cursor-pointer"
              onClick={() => account.refetch()}
          >
          </h2>
          <div className="card-actions justify-around">

            <div className="grid md:grid-cols-2 gap-4">
              {account.data && account.data.bricks.map((brickPublicKey) => (
                  <BrickCard
                      key={brickPublicKey.toString()}
                      brickPublicKey={brickPublicKey}
                  />
              ))}
            </div>

            <button
                className="btn btn-xs lg:btn-md btn-outline"
                onClick={() => increment.mutateAsync()}
                disabled={increment.isPending}
            >
              Increment
            </button>
            <button
                className="btn btn-xs lg:btn-md btn-outline"
                onClick={() => {
                  const value = window.prompt(
                      'Set value to:',
                      count.toString() ?? '0'
                  );
                  if (
                      !value ||
                      parseInt(value) === count ||
                      isNaN(parseInt(value))
                  ) {
                    return;
                  }
                  return set.mutateAsync(parseInt(value));
                }}
                disabled={set.isPending}
            >
              Set
            </button>
            <button
                className="btn btn-xs lg:btn-md btn-outline"
                onClick={() => decrement.mutateAsync()}
                disabled={decrement.isPending}
            >
              Decrement
            </button>
          </div>
          <div className="text-center space-y-4">
            <p>
              <ExplorerLink
                  path={`account/${wallPublicKey}`}
                  label={ellipsify(wallPublicKey.toString())}
              />
            </p>
            <button
              className="btn btn-xs btn-secondary btn-outline"
              onClick={() => {
                if (
                  !window.confirm(
                    'Are you sure you want to close this account?'
                  )
                ) {
                  return;
                }
                return close.mutateAsync();
              }}
              disabled={close.isPending}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function BrickCard({ brickPublicKey }: { brickPublicKey: PublicKey }) {
    return (
        <div className="card card-bordered border-base-300 border-4 text-neutral-content">
            <div>Brick</div>
            {brickPublicKey.toString()}
        </div>
    )
    // const { account} =
    //     useWallProgramAccount({
    //       wallPublicKey,
    //     });
    //
    // return account.isLoading ? (
    //     <span className="loading loading-spinner loading-lg"></span>
  // ) : (
  //     <div className="card card-bordered border-base-300 border-4 text-neutral-content">
  //       <div>Brick</div>
  //       {brickPublicKey.toString()}
  //     </div>
  // );
}