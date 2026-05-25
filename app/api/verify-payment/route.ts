import { NextRequest, NextResponse } from "next/server";
import { PublicKey, Connection } from "@solana/web3.js";
import { PumpAgent } from "@pump-fun/agent-payments-sdk";

export async function POST(req: NextRequest) {
  try {
    const { user, memo, startTime, endTime } = await req.json();

    if (!user || memo === undefined || startTime === undefined || endTime === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userPubkey = new PublicKey(user);
    const agentMint = new PublicKey(process.env.AGENT_TOKEN_MINT_ADDRESS!);
    const currencyMint = new PublicKey(process.env.CURRENCY_MINT!);
    const rpcUrl = process.env.SOLANA_RPC_URL!;

    const amount = 100_000_000; // 0.1 SOL in lamports

    const connection = new Connection(rpcUrl);
    const agent = new PumpAgent(agentMint, "mainnet", connection);

    const verified = await agent.validateInvoicePayment(
      userPubkey,
      currencyMint,
      amount,
      Number(memo),
      Number(startTime),
      Number(endTime)
    );

    return NextResponse.json({ verified });
  } catch (err: any) {
    console.error("Verify payment error:", err);
    return NextResponse.json(
      { error: err.message || "Verification failed" },
      { status: 500 }
    );
  }
}
