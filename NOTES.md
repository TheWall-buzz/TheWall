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


### Redeploy
Delete the target folder
Run anchor build, this will add a new keypair to target/deploy
run anchor keys list, this will give you the new program id
copy the id to the top of your lib.rs
anchor build && anchor deploy

