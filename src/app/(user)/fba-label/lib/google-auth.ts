import fs from "fs";
import path from "path";
import { google, Auth } from "googleapis";
type OAuth2Client = Auth.OAuth2Client;

const TOKENS_FILE = path.join(process.cwd(), "data", "fba-drive-tokens.json");

export interface DriveTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
  token_type?: string | null;
  scope?: string;
}

export function readTokens(): DriveTokens | null {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      return JSON.parse(fs.readFileSync(TOKENS_FILE, "utf-8")) as DriveTokens;
    }
  } catch {
    // corrupted file — treat as not connected
  }
  return null;
}

export function writeTokens(tokens: DriveTokens): void {
  const dir = path.dirname(TOKENS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), "utf-8");
}

export function clearTokens(): void {
  if (fs.existsSync(TOKENS_FILE)) fs.unlinkSync(TOKENS_FILE);
}

export function buildOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
}

export function getAuthorizationUrl(redirectUri: string): string {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
  return auth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
}

export async function exchangeCode(
  code: string,
  redirectUri: string
): Promise<DriveTokens> {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
  const { tokens } = await auth.getToken(code);
  return tokens as DriveTokens;
}

/**
 * Returns an authenticated OAuth2Client with auto-refresh, or null if not connected.
 * Persists refreshed tokens back to disk automatically.
 */
export async function getAuthenticatedClient(): Promise<OAuth2Client | null> {
  const tokens = readTokens();
  if (!tokens?.refresh_token) return null;

  const auth = buildOAuth2Client();
  auth.setCredentials(tokens);

  // Auto-save refreshed tokens
  auth.on("tokens", (newTokens) => {
    const merged: DriveTokens = {
      ...tokens,
      ...newTokens,
    };
    writeTokens(merged);
  });

  return auth;
}

export async function getConnectedEmail(): Promise<string | null> {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return null;
    const oauth2 = google.oauth2({ version: "v2", auth });
    const { data } = await oauth2.userinfo.get();
    return data.email ?? null;
  } catch {
    return null;
  }
}
