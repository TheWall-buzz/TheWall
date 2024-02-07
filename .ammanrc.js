module.exports = {
    validator: {
        killRunningValidators: true,
        programs: [],
        accounts: [
            {
                label: "Token Program",
                accountId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                executable: true,
                cluster: "https://api.devnet.solana.com"
            },
            {
                label: "Metaplex",
                accountId: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
                // You can set the cluster on a per account basis
                cluster: "https://api.devnet.solana.com",
            },
        ],
        jsonRpcUrl: "127.0.0.1",
        websocketUrl: "",
        commitment: "confirmed",
        ledgerDir: "./test-ledger",
        resetLedger: true,
        verifyFees: false,
        detached: false,
    },
    relay: {
        enabled: true,
        killlRunningRelay: true,
    },
    storage: {
        enabled: true,
        storageId: "mock-storage",
        clearOnStart: true,
    },
};