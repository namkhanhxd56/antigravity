import { NextRequest, NextResponse } from "next/server";
import { getAuthorizationUrl, clearTokens } from "../../lib/google-auth";

// GET /fba-label/api/auth — initiate OAuth flow
export async function GET(req: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET chưa được cấu hình trong .env.local" },
      { status: 500 }
    );
  }

  const redirectUri = `${req.nextUrl.origin}/fba-label/api/auth/callback`;
  const url = getAuthorizationUrl(redirectUri);
  return NextResponse.redirect(url);
}

// DELETE /fba-label/api/auth — disconnect (clear tokens)
export async function DELETE() {
  clearTokens();
  return NextResponse.json({ success: true });
}
