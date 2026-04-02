"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageScan {
  page: number;
  fnsku: string | null;
  found: boolean;
}

interface ScanResult {
  pages: PageScan[];
  total: number;
  found: number;
  errors: number;
}

interface Config {
  addText: boolean;
  text: string;
  x: number;
  y: number;
  fontsize: number;
}

interface LogEntry {
  msg: string;
  level: "info" | "ok" | "err" | "warn";
}

interface DriveConfig {
  folderId: string;
  spreadsheetId: string;
  sheetName: string;
}

interface DriveStatus {
  connected: boolean;
  email?: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CardHead({
  num,
  title,
  numBg = "bg-[#0594c8]",
}: {
  num: string;
  title: string;
  numBg?: string;
}) {
  return (
    <div className="bg-[#c2e8f8] px-3 py-2 flex items-center gap-2 border-b border-[#9dd0e8]">
      <div
        className={`w-5 h-5 ${numBg} text-white rounded-full text-[10px] font-bold flex items-center justify-center shrink-0`}
      >
        {num}
      </div>
      <span className="text-[11px] font-semibold text-[#066e96] uppercase tracking-wider">
        {title}
      </span>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#9dd0e8] rounded-[10px] overflow-hidden shrink-0">
      {children}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function FbaLabelPage() {
  const [file, setFile] = useState<File | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [downloadReady, setDownloadReady] = useState(false);
  const [savedZipBase64, setSavedZipBase64] = useState<string>("");
  const [config, setConfig] = useState<Config>({
    addText: true,
    text: "MADE IN VIETNAM",
    x: 10,
    y: 78,
    fontsize: 7,
  });

  // ── Google Drive state ──────────────────────────────────────────────────────
  const [driveStatus, setDriveStatus] = useState<DriveStatus>({ connected: false });
  const [driveConfig, setDriveConfig] = useState<DriveConfig>({ folderId: "", spreadsheetId: "", sheetName: "Sheet1" });
  const [driveSaving, setDriveSaving] = useState(false);
  const [driveSaved, setDriveSaved] = useState(false);

  useEffect(() => {
    // Load Drive status and config on mount; also handle OAuth redirect params
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_connected")) {
      window.history.replaceState({}, "", "/fba-label");
    }
    if (params.get("google_error")) {
      alert(`Lỗi đăng nhập Google: ${params.get("google_error")}`);
      window.history.replaceState({}, "", "/fba-label");
    }

    fetch("/fba-label/api/auth/status")
      .then((r) => r.json())
      .then((d) => setDriveStatus(d))
      .catch(() => {});

    fetch("/fba-label/api/drive-config")
      .then((r) => r.json())
      .then((d) => setDriveConfig(d))
      .catch(() => {});
  }, []);

  const saveDriveConfig = async () => {
    setDriveSaving(true);
    setDriveSaved(false);
    await fetch("/fba-label/api/drive-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(driveConfig),
    });
    setDriveSaving(false);
    setDriveSaved(true);
    setTimeout(() => setDriveSaved(false), 2500);
  };

  const disconnectGoogle = async () => {
    await fetch("/fba-label/api/auth", { method: "DELETE" });
    setDriveStatus({ connected: false });
  };
  // ────────────────────────────────────────────────────────────────────────────

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logBoxRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string, level: LogEntry["level"] = "info") => {
    setLogs((prev) => [...prev, { msg, level }]);
    setTimeout(() => {
      if (logBoxRef.current)
        logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }, 0);
  }, []);

  const scanFile = useCallback(
    async (f: File) => {
      setIsScanning(true);
      setScanResult(null);
      setLogs([]);
      setDownloadReady(false);

      const form = new FormData();
      form.append("file", f);
      try {
        const res = await fetch("/fba-label/api/scan", { method: "POST", body: form });
        const data = await res.json();
        if (data.error) addLog(data.error, "err");
        else setScanResult(data);
      } catch {
        addLog("Lỗi kết nối server", "err");
      } finally {
        setIsScanning(false);
      }
    },
    [addLog]
  );

  const MAX_SIZE_MB = 50;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  const handleFile = useCallback(
    (f: File) => {
      if (!f.name.toLowerCase().endsWith(".pdf")) {
        alert("Chỉ nhận file .pdf");
        return;
      }
      if (f.size > MAX_SIZE_BYTES) {
        alert(`File quá lớn. Tối đa ${MAX_SIZE_MB}MB.`);
        return;
      }
      setFile(f);
      scanFile(f);
    },
    [scanFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const clearFile = () => {
    setFile(null);
    setScanResult(null);
    setLogs([]);
    setDownloadReady(false);
    setSavedZipBase64("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerDownload = (base64: string) => {
    const byteChars = atob(base64);
    const byteArr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++)
      byteArr[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteArr], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fba_labels.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleProcess = async () => {
    if (!file || !scanResult) return;
    setIsProcessing(true);
    setLogs([]);
    setDownloadReady(false);

    const form = new FormData();
    form.append("file", file);
    form.append("config", JSON.stringify(config));

    try {
      const res = await fetch("/fba-label/api/process", { method: "POST", body: form });
      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let zipBase64 = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.type === "log") addLog(data.msg, data.level ?? "info");
            else if (data.type === "done") zipBase64 = data.zipBase64;
          } catch {
            addLog(`[WARN] Malformed chunk: ${line.slice(0, 80)}`, "warn");
          }
        }
      }

      if (zipBase64) {
        setSavedZipBase64(zipBase64);
        triggerDownload(zipBase64);
        setDownloadReady(true);
      }
    } catch (e) {
      addLog(`Lỗi: ${e instanceof Error ? e.message : String(e)}`, "err");
    } finally {
      setIsProcessing(false);
    }
  };

  const logColor = (level: LogEntry["level"]) => {
    if (level === "ok") return "text-[#5db870]";
    if (level === "err") return "text-[#e05a5a]";
    if (level === "warn") return "text-[#d4963a]";
    return "text-[#7eccea]";
  };

  const canProcess = !!file && !!scanResult && !isScanning && !isProcessing;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Top bar */}
      <header className="shrink-0 h-12 bg-[#0594c8] text-white flex items-center px-6 gap-4">
        <span className="text-[15px] font-semibold tracking-tight">FBA Label Tool</span>
        <span className="text-[11px] opacity-60 font-normal hidden sm:block">
          PDF → Edit → PNG → ZIP
        </span>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 text-[12px] font-medium opacity-80 hover:opacity-100 transition-opacity bg-white/15 hover:bg-white/25 px-3 py-1 rounded-full"
          >
            <span className="material-symbols-outlined text-[14px]">home</span>
            Home
          </Link>
          <a
            href="/fba-label/guide/FBA_Label_Tool_Huong_Dan.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[12px] font-medium opacity-80 hover:opacity-100 transition-opacity bg-white/15 hover:bg-white/25 px-3 py-1 rounded-full"
            title="Xem hướng dẫn sử dụng"
          >
            <span className="material-symbols-outlined text-[14px]">menu_book</span>
            Hướng dẫn
          </a>
          <a
            href="https://drive.google.com/drive/u/0/folders/1gV-W6tKqclGDCUQQX4waSKlf5KIVhw15"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[12px] font-medium opacity-80 hover:opacity-100 transition-opacity bg-white/15 hover:bg-white/25 px-3 py-1 rounded-full"
            title="Tải phiên bản offline (chạy trên máy tính)"
          >
            <span className="material-symbols-outlined text-[14px]">download</span>
            Download
          </a>
          <span className="font-mono text-[11px] bg-white/20 px-3 py-0.5 rounded-full">
            Offline mode
          </span>
        </div>
      </header>

      {/* 2-column main */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr] overflow-hidden">

        {/* ── LEFT ── */}
        <div className="overflow-y-auto p-3 flex flex-col gap-3 bg-white border-r border-[#9dd0e8]">

          {/* 1 Upload */}
          <Card>
            <CardHead num="1" title="Upload file PDF" />
            <div className="p-3">
              {/* Dropzone */}
              {!file ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-[#0594c8] bg-[#c2e8f8]"
                      : "border-[#6ab8d8] bg-[#eaf6fd] hover:border-[#0594c8] hover:bg-[#c2e8f8]"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                  />
                  <div className="text-2xl mb-1 opacity-50">📄</div>
                  <p className="text-[12px] text-[#5a8a99] font-medium">
                    Kéo thả hoặc click để chọn
                  </p>
                  <p className="text-[10px] text-[#9ac] mt-1 font-mono">
                    Chỉ nhận .pdf · tối đa 50MB
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-[#eaf6fd] border border-[#9dd0e8] rounded-lg">
                  <div className="w-7 h-7 bg-red-50 rounded-md flex items-center justify-center text-sm shrink-0">
                    📄
                  </div>
                  <span className="font-mono text-[11px] flex-1 truncate text-[#0d2d3a]">
                    {file.name}
                  </span>
                  <button
                    onClick={clearFile}
                    className="text-[#5a8a99] hover:text-red-500 hover:bg-red-50 rounded px-1 text-sm leading-none transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* FNSKU List */}
              {(isScanning || scanResult) && (
                <div className="mt-2 border border-[#9dd0e8] rounded-lg overflow-hidden">
                  {isScanning ? (
                    <div className="px-3 py-2 text-[11px] text-[#5a8a99] font-mono">
                      Đang đọc FNSKU...
                    </div>
                  ) : scanResult && (
                    <>
                      <div
                        className={`px-3 py-1.5 text-[10px] font-mono flex gap-3 sticky top-0 ${
                          scanResult.errors > 0
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        <span>✓ {scanResult.found} tìm thấy</span>
                        {scanResult.errors > 0 && (
                          <span>✗ {scanResult.errors} lỗi</span>
                        )}
                        <span>/ {scanResult.total} trang</span>
                      </div>
                      <div className="max-h-[120px] overflow-y-auto">
                        {scanResult.pages.map((p) => (
                          <div
                            key={p.page}
                            className="flex items-center gap-2 px-3 py-1 text-[11px] hover:bg-[#eaf6fd]"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                p.found ? "bg-emerald-600" : "bg-red-500"
                              }`}
                            />
                            <span className="font-mono text-[10px] text-[#5a8a99] w-14 shrink-0">
                              Trang {p.page}
                            </span>
                            <span
                              className={`font-mono flex-1 text-[10px] ${
                                p.found ? "text-[#0d2d3a]" : "text-[#5a8a99]"
                              }`}
                            >
                              {p.fnsku ?? "Không tìm thấy FNSKU"}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                                p.found
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >
                              {p.found ? "OK" : "ERR"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* 2 Options */}
          <Card>
            <CardHead num="2" title="Tuỳ chọn" />
            <div className="p-3 space-y-3">
              {/* Toggle add text */}
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#0d2d3a]">
                  Thêm text lên label
                </span>
                <button
                  role="switch"
                  aria-checked={config.addText}
                  onClick={() => setConfig((c) => ({ ...c, addText: !c.addText }))}
                  className={`relative w-9 h-5 rounded-full transition-colors ${
                    config.addText ? "bg-[#0594c8]" : "bg-[#9dd0e8]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      config.addText ? "translate-x-[18px]" : "translate-x-[2px]"
                    }`}
                  />
                </button>
              </div>

              {/* Text config */}
              {config.addText && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#5a8a99] mb-1">
                      Text trên label
                    </label>
                    <input
                      type="text"
                      value={config.text}
                      onChange={(e) => setConfig((c) => ({ ...c, text: e.target.value }))}
                      className="w-full text-[12px] font-mono px-2 py-1.5 bg-[#eaf6fd] border border-[#9dd0e8] rounded-md text-[#0d2d3a] focus:outline-none focus:border-[#0594c8]"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#5a8a99] mb-1">
                        X (pt)
                      </label>
                      <input
                        type="number"
                        value={config.x}
                        onChange={(e) => setConfig((c) => ({ ...c, x: parseFloat(e.target.value) || 0 }))}
                        className="w-full text-[12px] font-mono px-2 py-1.5 bg-[#eaf6fd] border border-[#9dd0e8] rounded-md text-[#0d2d3a] focus:outline-none focus:border-[#0594c8]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#5a8a99] mb-1">
                        Y (pt)
                      </label>
                      <input
                        type="number"
                        value={config.y}
                        onChange={(e) => setConfig((c) => ({ ...c, y: parseFloat(e.target.value) || 0 }))}
                        className="w-full text-[12px] font-mono px-2 py-1.5 bg-[#eaf6fd] border border-[#9dd0e8] rounded-md text-[#0d2d3a] focus:outline-none focus:border-[#0594c8]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#5a8a99] mb-1">
                        Size
                      </label>
                      <input
                        type="number"
                        value={config.fontsize}
                        onChange={(e) => setConfig((c) => ({ ...c, fontsize: parseFloat(e.target.value) || 7 }))}
                        className="w-full text-[12px] font-mono px-2 py-1.5 bg-[#eaf6fd] border border-[#9dd0e8] rounded-md text-[#0d2d3a] focus:outline-none focus:border-[#0594c8]"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-[#5a8a99] font-mono">
                    1mm ≈ 2.84pt · Label 40×30mm = 113×85pt
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* 3 Google Drive */}
          <Card>
            <CardHead num="3" title="Google Drive" numBg="bg-[#1a73e8]" />
            <div className="p-3 space-y-3">

              {/* Connect status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${driveStatus.connected ? "bg-emerald-500" : "bg-[#9dd0e8]"}`} />
                  <span className="text-[11px] text-[#0d2d3a] font-medium">
                    {driveStatus.connected ? driveStatus.email : "Chưa kết nối"}
                  </span>
                </div>
                {driveStatus.connected ? (
                  <button
                    onClick={disconnectGoogle}
                    className="text-[10px] font-semibold text-red-500 hover:text-red-700 px-2 py-0.5 rounded border border-red-200 hover:border-red-400 transition-colors"
                  >
                    Ngắt kết nối
                  </button>
                ) : (
                  <a
                    href="/fba-label/api/auth"
                    className="text-[10px] font-semibold text-white bg-[#1a73e8] hover:bg-[#1557b0] px-3 py-1 rounded transition-colors"
                  >
                    Đăng nhập Google
                  </a>
                )}
              </div>

              {/* Folder ID */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#5a8a99] mb-1">
                  Drive Folder ID
                </label>
                <input
                  type="text"
                  value={driveConfig.folderId}
                  onChange={(e) => setDriveConfig((c) => ({ ...c, folderId: e.target.value }))}
                  placeholder="1gV-W6tKqclGDCUQQX4..."
                  className="w-full text-[11px] font-mono px-2 py-1.5 bg-[#eaf6fd] border border-[#9dd0e8] rounded-md text-[#0d2d3a] focus:outline-none focus:border-[#0594c8] placeholder:text-[#9dd0e8]"
                />
              </div>

              {/* Spreadsheet ID */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#5a8a99] mb-1">
                  Spreadsheet ID
                </label>
                <input
                  type="text"
                  value={driveConfig.spreadsheetId}
                  onChange={(e) => setDriveConfig((c) => ({ ...c, spreadsheetId: e.target.value }))}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs..."
                  className="w-full text-[11px] font-mono px-2 py-1.5 bg-[#eaf6fd] border border-[#9dd0e8] rounded-md text-[#0d2d3a] focus:outline-none focus:border-[#0594c8] placeholder:text-[#9dd0e8]"
                />
              </div>

              {/* Sheet Name */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#5a8a99] mb-1">
                  Sheet Name
                </label>
                <input
                  type="text"
                  value={driveConfig.sheetName}
                  onChange={(e) => setDriveConfig((c) => ({ ...c, sheetName: e.target.value }))}
                  placeholder="Sheet1"
                  className="w-full text-[11px] font-mono px-2 py-1.5 bg-[#eaf6fd] border border-[#9dd0e8] rounded-md text-[#0d2d3a] focus:outline-none focus:border-[#0594c8] placeholder:text-[#9dd0e8]"
                />
              </div>

              {/* Save config button */}
              <button
                onClick={saveDriveConfig}
                disabled={driveSaving}
                className={`w-full py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  driveSaved
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                    : "bg-[#eaf6fd] hover:bg-[#c2e8f8] text-[#066e96] border border-[#9dd0e8]"
                }`}
              >
                {driveSaved ? "✓ Đã lưu" : driveSaving ? "Đang lưu..." : "Lưu cấu hình"}
              </button>

              {!driveStatus.connected && (
                <p className="text-[10px] text-[#5a8a99]">
                  Cần thêm <code className="bg-[#eaf6fd] px-1 rounded">GOOGLE_CLIENT_ID</code> và{" "}
                  <code className="bg-[#eaf6fd] px-1 rounded">GOOGLE_CLIENT_SECRET</code> vào <code className="bg-[#eaf6fd] px-1 rounded">.env.local</code>.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* ── RIGHT ── */}
        <div className="overflow-y-auto p-3 flex flex-col gap-3 bg-[#eaf6fd]">

          {/* Log console */}
          <div className="bg-white border border-[#9dd0e8] rounded-[10px] overflow-hidden flex flex-col flex-1 min-h-0">
            <CardHead num="▶" title="Chạy &amp; Log" numBg="bg-emerald-700" />
            <div className="p-3 flex flex-col flex-1 min-h-0">
              {/* Log box */}
              <div
                ref={logBoxRef}
                className="flex-1 min-h-[220px] bg-[#0f1e26] rounded-lg px-3 py-3 font-mono text-[11px] leading-relaxed overflow-y-auto whitespace-pre-wrap break-all"
              >
                {logs.length === 0 ? (
                  <span className="text-[#3a8aaa]">— Chờ upload file và bắt đầu —</span>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={logColor(log.level)}>
                      {log.msg}
                    </div>
                  ))
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleProcess}
                  disabled={!canProcess}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-semibold bg-[#0594c8] hover:bg-[#066e96] text-white transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Bắt đầu xử lý"
                  )}
                </button>
                {downloadReady && (
                  <button
                    onClick={() => triggerDownload(savedZipBase64)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[12px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
                  >
                    ⬇ Tải lại
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-white border border-[#9dd0e8] rounded-[10px] p-4 text-[11px] text-[#5a8a99] space-y-1 shrink-0">
            <p className="font-semibold text-[#0d2d3a]">Hướng dẫn nhanh</p>
            <p>1. Upload file PDF chứa FBA label (nhiều trang).</p>
            <p>2. Kiểm tra danh sách FNSKU được phát hiện.</p>
            <p>3. Tuỳ chỉnh text (nếu cần), bấm <strong>Bắt đầu xử lý</strong>.</p>
            <p>4. File <code className="bg-[#eaf6fd] px-1 rounded">fba_labels.zip</code> sẽ tự tải về — mỗi label là 1 ảnh PNG 300 DPI.</p>
          </div>
        </div>
      </div>
    </>
  );
}
