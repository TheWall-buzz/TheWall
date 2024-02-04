import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Wall4 } from "../target/types/wall4";

describe("wall4", () => {
  // Configure the client to use the local cluster.

  //console.log( anchor.Provider);
  // const provider = anchor.Provider.local("http://127.0.0.1:8899");
  // anchor.setProvider(provider);

  anchor.setProvider(anchor.AnchorProvider.env());


  // const provider = anchor.Provider.local("http://127.0.0.1:8899");

  const program = anchor.workspace.Wall4 as Program<Wall4>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
