solana-test-validator

anchor test --skip-local-validator

https://github.com/solana-labs/solana/issues/34987

cargo build-sbf --tools-version v1.39

anchor build --solana-version 1.17.19



---
solana-install init 1.18.0
cargo add solana-program@=1.18.0
cargo update -p solana-program


ANCHOR_PROVIDER_URL
ANCHOR_WALLET

export ANCHOR_PROVIDER_URL=http://127.0.0.1:8899
export ANCHOR_WALLET=/Users/am/.config/solana/id.json

solana config set --url http://0.0.0.0:8899
solana config set --url http://127.0.0.1:8899

### Run test
anchor test --skip-local-validator

solana address
4siwryZZU7EaTJWBcsbzaff6pdEE9c3RLrntHNBHnVYT


mint nft tx: https://explorer.solana.com/tx/4sCTXxQC8HCoJ9jd9hx82MsrvTtK3k8Bxw2PpineYNB9Tk5GVWWCkiU74U7F15ChwZ3yTFeaNWHZBHDSHb8n5SAr?cluster=devnet
minted nft: https://explorer.solana.com/address/ANNv7CaqNd56a6FqbHFa4mhtoDEaxgNQPMGXZxdyKxyn?cluster=devnet


### Redeploy
Delete the target folder

```
anchor build && anchor keys list
```

This will give you the new program id. Copy the id to the top of your lib.rs and other files.

```
anchor build && anchor deploy
anchor test --skip-local-validator

anchor test --skip-build --skip-deploy
```

solana config set --url http://127.0.0.1:8899

solana config set --url devnet

solana-test-validator --clone metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s --url https://api.devnet.solana.com --reset

TODO
- Frontend
  - See the list of walls
  - See a Wall
  - Add a Wall, ability to change text
  - Add a Brick, ability to change text
  - Upload images and create metadata.json
- Smart Contract
  - Receive SOL to TheWall account when adding a Wall 
  - Receive SOL to the Wall owner when adding a Brick
- Deploy to Vercel

mpl_token_metadata/digitalAsset.d.ts
/**
* Fetches all digital assets from a verified collection. This does not work on older nfts that do not have a tokenStandard set.
  */
  export declare function fetchAllDigitalAssetByVerifiedCollection(context: Pick<Context, 'rpc' | 'eddsa' | 'programs'>, collectionAddress: PublicKey, options?: RpcGetAccountsOptions): Promise<DigitalAsset[]>;

}).rpc({
skipPreflight:true
})

### Wall Use Cases
1. User creates a Wall NxM bricks and pays N*M*fee SOL.
   Actions:
      - Mint the Wall as a Collection NFT
      - Mint each Brick as an NFT which belongs to the Wall Collection NFT
      - Perform "Set and verify a sized collection item" for each Brick, so that the collection is verified
   Now the whole Wall and its Bricks belong to the User.
2. User can modify any Brick which they own - put an image, link or whatever they want to it
3. User can put the Wall or any Brick that they own for sale