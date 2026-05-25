# $CLAW RNG — Random Number Generator

Pay 0.1 SOL to generate a random number between 0 and 1000.

Built with Next.js, Solana Wallet Adapter, and pump.fun Agent Payments SDK.

## Setup

```bash
npm install
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values.

## Deploy to Vercel

```bash
npx vercel --prod
```

Or link to your Vercel account and push to GitHub.

## How It Works

1. User connects their Solana wallet
2. Clicks "Pay & Generate" — creates a 0.1 SOL payment invoice
3. User signs the transaction in their wallet
4. Transaction is sent to Solana
5. Server verifies the payment on-chain via pump.fun's payment verification API
6. Random number is generated server-side using Web Crypto API
7. Number is displayed to the user

## Tech Stack

- Next.js 14 (App Router)
- @solana/wallet-adapter-react
- @pump-fun/agent-payments-sdk
- TypeScript
