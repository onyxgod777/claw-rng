import { NextRequest, NextResponse } from "next/server";
import { PublicKey, Connection, Transaction } from "@solana/web3.js";
import { PumpAgent } from "@pump-fun/agent-payments-sdk";

export async function POST(req: NextRequest) {
  try {
    const { user } = await req.json();
    if (!user) {
      return NextResponse.json({ error: "Missing user address" }, { status: 400 });
    }

    const userPubkey = new PublicKey(user);
    const agentMint = new PublicKey(process.env.AGENT_TOKEN_MINT_ADDRESS!);
    const currencyMint = new PublicKey(process.env.CURRENCY_MINT!);
    const rpcUrl = process.env.SOLANA_RPC_URL!;

    // 0.1 SOL in lamports (9 decimals)
    const amount = "100000000"; // 0.1 SOL

    // Unique invoice memo
    const memo = String(Math.floor(Math.random() * 900000000000) + 100000);

    // Invoice validity window: 5 minutes
    const now = Math.floor(Date.now() / 1000);
    const startTime = String(now);
    const endTime = String(now + 300);

    const connection = new Connection(rpcUrl);
    const agent = new PumpAgent(agentMint, "mainnet", connection);

    const ixs = await agent.buildAcceptPaymentInstructions({
      user: userPubkey,
      currencyMint,
      amount,
      memo,
      startTime,
      endTime,
    });

    // Build transaction
    const tx = new Transaction();
    tx.add(...ixs);
    tx.feePayer = userPubkey;

    const blockhash = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash.blockhash;

    // Serialize to base64 for the client to sign
    const txBase64 = tx
      .serialize({ requireAllSignatures: false })
      .toString("base64");

    return NextResponse.json({
      txBase64,
      memo: Number(memo),
      startTime: Number(startTime),
      endTime: Number(endTime),
    });
  } catch (err: any) {
    console.error("Create payment error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create payment" },
      { status: 500 }
    );
  }
}
