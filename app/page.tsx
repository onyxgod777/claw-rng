"use client";

import { useState, useCallback } from "react";
import {
  useWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import AppWalletProvider from "@/components/WalletProvider";

type Step = "idle" | "creating" | "signing" | "sending" | "verifying" | "done" | "error";

function RNGContent() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  const [step, setStep] = useState<Step>("idle");
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [txSignature, setTxSignature] = useState<string>("");
  const [generatedNumber, setGeneratedNumber] = useState<number | null>(null);

  const steps: { key: Step; label: string }[] = [
    { key: "creating", label: "Creating payment invoice..." },
    { key: "signing", label: "Sign transaction in wallet..." },
    { key: "sending", label: "Sending transaction..." },
    { key: "verifying", label: "Verifying payment on-chain..." },
    { key: "done", label: "✅ Payment confirmed! Generating number..." },
  ];

  const handlePayAndGenerate = useCallback(async () => {
    if (!publicKey || !signTransaction) return;

    setStep("creating");
    setError("");
    setResult(null);
    setGeneratedNumber(null);

    try {
      // 1. Get the payment transaction from server
      const createRes = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: publicKey.toBase58() }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.error || "Failed to create payment");
      }

      const { txBase64, memo, startTime, endTime } = await createRes.json();
      setStep("signing");

      // 2. User signs the transaction
      const tx = Transaction.from(Buffer.from(txBase64, "base64"));
      const signedTx = await signTransaction(tx);
      setStep("sending");

      // 3. Send the transaction
      const sig = await connection.sendRawTransaction(
        signedTx.serialize(),
        { skipPreflight: false, preflightCommitment: "confirmed" }
      );
      setTxSignature(sig);

      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction(
        { signature: sig, ...latestBlockhash },
        "confirmed"
      );

      setStep("verifying");

      // 4. Verify payment server-side
      const verifyRes = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: publicKey.toBase58(),
          memo,
          startTime,
          endTime,
        }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json();
        throw new Error(errData.error || "Payment verification failed");
      }

      const { verified } = await verifyRes.json();
      if (!verified) throw new Error("Payment not found on-chain");

      setStep("done");

      // 5. Generate random number
      const genRes = await fetch("/api/generate-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: publicKey.toBase58(),
          memo,
        }),
      });

      if (!genRes.ok) {
        const errData = await genRes.json();
        throw new Error(errData.error || "Generation failed");
      }

      const { number } = await genRes.json();
      setGeneratedNumber(number);
      setResult(number);
      setStep("idle");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setStep("error");
    }
  }, [publicKey, signTransaction, connection]);

  return (
    <div className="container">
      <img
        src="https://claw.thealpha-secret.xyz/img/coin.png"
        alt="$CLAW"
        className="logo"
      />
      <h1>$CLAW RNG</h1>
      <p className="subtitle">
        Pay 0.1 SOL to generate a random number between 0 and 1000
      </p>

      <div
        className={`wallet-status ${
          publicKey ? "wallet-connected" : "wallet-disconnected"
        }`}
      >
        {publicKey
          ? `🔗 ${publicKey.toBase58().slice(0, 4)}...${publicKey
              .toBase58()
              .slice(-4)}`
          : "⛔ Wallet not connected"}
      </div>

      <WalletMultiButton />

      {publicKey && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2>Generate Random Number</h2>
          <div className="price">
            0.1 <span>SOL</span>
          </div>
          <p style={{ color: "#8a886e", fontSize: "0.85rem", marginBottom: 16 }}>
            One random number between <strong style={{ color: "#d4a843" }}>0</strong> and{" "}
            <strong style={{ color: "#d4a843" }}>1000</strong>
          </p>

          <button
            className="btn btn-primary"
            onClick={handlePayAndGenerate}
            disabled={step !== "idle" && step !== "error"}
          >
            {step === "creating" || step === "signing" || step === "sending" || step === "verifying" || step === "done" ? (
              <><span className="loading-spinner" /> Processing...</>
            ) : (
              "🎲 Pay & Generate"
            )}
          </button>

          {(step === "creating" ||
            step === "signing" ||
            step === "sending" ||
            step === "verifying" ||
            step === "done") && (
            <div className="status-steps">
              {steps.map((s) => (
                <div
                  key={s.key}
                  className={`step ${
                    steps.findIndex((x) => x.key === s.key) <=
                    steps.findIndex((x) => x.key === step)
                      ? "active"
                      : ""
                  } ${
                    steps.findIndex((x) => x.key === s.key) <
                    steps.findIndex((x) => x.key === step)
                      ? "done"
                      : ""
                  }`}
                >
                  <div className="step-icon">
                    {steps.findIndex((x) => x.key === s.key) <
                    steps.findIndex((x) => x.key === step)
                      ? "✓"
                      : steps.findIndex((x) => x.key === s.key) ===
                        steps.findIndex((x) => x.key === step)
                      ? "●"
                      : "○"}
                  </div>
                  {s.label}
                </div>
              ))}
            </div>
          )}

          {error && <div className="error">❌ {error}</div>}
        </div>
      )}

      {generatedNumber !== null && (
        <div className="result-box">
          <div className="result-label">🎲 Your Random Number</div>
          <div className="result-number">{generatedNumber}</div>
          <div className="result-label">between 0 and 1000</div>
        </div>
      )}

      {txSignature && (
        <p style={{ marginTop: 12, fontSize: "0.8rem", color: "#4a483e" }}>
          Tx:{" "}
          <a
            href={`https://solscan.io/tx/${txSignature}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#8a886e" }}
          >
            {txSignature.slice(0, 8)}...{txSignature.slice(-8)}
          </a>
        </p>
      )}

      <div className="footer">
        <p>
          Powered by <a href="https://claw.thealpha-secret.xyz">$CLAW</a>
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AppWalletProvider>
      <RNGContent />
    </AppWalletProvider>
  );
}
