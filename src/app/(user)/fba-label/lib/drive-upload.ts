import { google, Auth } from "googleapis";
import { Readable } from "stream";
type OAuth2Client = Auth.OAuth2Client;

export interface UploadResult {
  fileId: string;
  link: string;
}

export async function uploadPng(
  auth: OAuth2Client,
  pngBuffer: Buffer,
  filename: string,
  folderId: string
): Promise<UploadResult> {
  const drive = google.drive({ version: "v3", auth });

  const { data: file } = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType: "image/png",
      body: Readable.from(pngBuffer),
    },
    fields: "id",
    supportsAllDrives: true,
  });

  const fileId = file.id!;

  // Make publicly readable (anyone with link)
  await drive.permissions.create({
    fileId,
    requestBody: { type: "anyone", role: "reader" },
    supportsAllDrives: true,
  });

  return {
    fileId,
    link: `https://drive.google.com/uc?id=${fileId}`,
  };
}
