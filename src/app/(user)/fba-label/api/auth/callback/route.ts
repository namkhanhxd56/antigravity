import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, writeTokens } from "../../../lib/google-auth";

// GET /fba-label/api/auth/callback — Google OAuth redirect
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    const reason = error ?? "missing_code";
    return NextResponse.redirect(`${origin}/fba-label?google_error=${encodeURIComponent(reason)}`);
  }

  try {
    const redirectUri = `${origin}/fba-label/api/auth/callback`;
    const tokens = await exchangeCode(code, redirectUri);
    writeTokens(tokens);
    return NextResponse.redirect(`${origin}/fba-label?google_connected=1`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.redirect(`${origin}/fba-label?google_error=${encodeURIComponent(msg)}`);
  }
}
