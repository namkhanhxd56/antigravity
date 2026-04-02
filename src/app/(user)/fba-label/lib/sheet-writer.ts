import { google } from "googleapis";
import type { OAuth2Client } from "googleapis/build/src/auth/oauth2client";

export async function getExistingFnskus(
  auth: OAuth2Client,
  spreadsheetId: string,
  sheetName: string
): Promise<Set<string>> {
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:A`,
  });
  const rows = res.data.values ?? [];
  return new Set(rows.map((r) => r[0]).filter(Boolean));
}

export async function appendRow(
  auth: OAuth2Client,
  spreadsheetId: string,
  sheetName: string,
  fnsku: string,
  driveLink: string
): Promise<void> {
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:B`,
    valueInputOption: "RAW",
    requestBody: { values: [[fnsku, driveLink]] },
  });
}
