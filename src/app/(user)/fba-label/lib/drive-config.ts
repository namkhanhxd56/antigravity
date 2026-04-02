import fs from "fs";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), "data", "fba-drive-config.json");

export interface DriveConfig {
  folderId: string;
  spreadsheetId: string;
  sheetName: string;
}

const DEFAULT_CONFIG: DriveConfig = {
  folderId: "",
  spreadsheetId: "",
  sheetName: "Sheet1",
};

export function readDriveConfig(): DriveConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8")) };
    }
  } catch {
    // corrupted — return defaults
  }
  return { ...DEFAULT_CONFIG };
}

export function writeDriveConfig(config: DriveConfig): void {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}
