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

solana config set --url devnet

solana-test-validator --clone metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s --url https://api.devnet.solana.com --reset

