import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "$CLAW RNG — Random Number Generator",
  description:
    "Connect your Solana wallet, pay 0.1 SOL, and generate a random number between 0 and 1000. Powered by $CLAW.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
