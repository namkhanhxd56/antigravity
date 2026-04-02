import { NextResponse } from "next/server";
import { readTokens, getConnectedEmail } from "../../../lib/google-auth";

// GET /fba-label/api/auth/status
export async function GET() {
  const tokens = readTokens();
  if (!tokens?.refresh_token) {
    return NextResponse.json({ connected: false });
  }

  const email = await getConnectedEmail();
  if (!email) {
    // Tokens exist but can't fetch user info — likely expired/revoked
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({ connected: true, email });
}
