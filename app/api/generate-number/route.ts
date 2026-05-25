import { NextRequest, NextResponse } from "next/server";

// Track which sessions have generated a number (in-memory)
const usedSessions = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const { user, memo } = await req.json();

    if (!user || !memo) {
      return NextResponse.json(
        { error: "Missing user or memo" },
        { status: 400 }
      );
    }

    // Prevent duplicate generation for the same session
    const sessionKey = `${user}-${memo}`;
    if (usedSessions.has(sessionKey)) {
      return NextResponse.json(
        { error: "Already generated for this payment" },
        { status: 429 }
      );
    }
    usedSessions.add(sessionKey);

    // Generate cryptographically-sound random number
    // Uses Web Crypto API (available in Edge/Node runtime)
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const number = (array[0] % 1001); // 0 to 1000 inclusive

    return NextResponse.json({ number, range: { min: 0, max: 1000 } });
  } catch (err: any) {
    console.error("Generate number error:", err);
    return NextResponse.json(
      { error: err.message || "Generation failed" },
      { status: 500 }
    );
  }
}
