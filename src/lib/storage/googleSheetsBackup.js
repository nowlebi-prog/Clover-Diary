import { STORAGE_KEYS } from "./storageKeys";
import { getAllData } from "./localStorageAdapter";

const AUTO_BACKUP_INTERVAL_MS = 10 * 60 * 1000;
const BACKUP_DEBOUNCE_MS = 5000;

let backupTimer = null;
let changeTimer = null;
let running = false;

const todayKey = () => new Date().toISOString().slice(0, 10);

const defaultConfig = {
  enabled: false,
  webhookUrl: "",
  lastBackupAt: "",
  lastBackupDate: "",
  lastStatus: "idle",
  lastError: ""
};

function readConfig() {
  try {
    return { ...defaultConfig, ...(JSON.parse(localStorage.getItem(STORAGE_KEYS.googleSheetsBackup) || "{}") || {}) };
  } catch {
    return { ...defaultConfig };
  }
}

function writeConfig(updates) {
  const next = { ...readConfig(), ...updates };
  localStorage.setItem(STORAGE_KEYS.googleSheetsBackup, JSON.stringify(next));
  window.dispatchEvent(new Event("clover-backup-change"));
  return next;
}

function compactValue(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return JSON.stringify(value);
}

function buildRows(items = []) {
  return items.map((item) => {
    const row = {};
    Object.entries(item || {}).forEach(([key, value]) => {
      row[key] = compactValue(value);
    });
    return row;
  });
}

export function getGoogleSheetsBackupConfig() {
  return readConfig();
}

export function saveGoogleSheetsBackupConfig(updates) {
  return writeConfig(updates);
}

export function buildGoogleSheetsBackupPayload(data = getAllData()) {
  const collections = Object.entries(data)
    .filter(([, value]) => Array.isArray(value))
    .map(([name, rows]) => ({ name, rows: buildRows(rows), count: rows.length }));

  return {
    app: "Clover Desk",
    version: 1,
    backupDate: todayKey(),
    createdAt: new Date().toISOString(),
    summary: collections.reduce((acc, sheet) => ({ ...acc, [sheet.name]: sheet.count }), {}),
    collections,
    rawData: data
  };
}

export async function backupToGoogleSheets({ manual = false } = {}) {
  const config = readConfig();
  const url = (config.webhookUrl || "").trim();
  if (!config.enabled || !url) return { ok: false, skipped: true, reason: "not-configured" };
  if (running) return { ok: false, skipped: true, reason: "already-running" };

  running = true;
  writeConfig({ lastStatus: "running", lastError: "" });

  try {
    const payload = buildGoogleSheetsBackupPayload();
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const now = new Date().toISOString();
    writeConfig({
      lastBackupAt: now,
      lastBackupDate: payload.backupDate,
      lastStatus: manual ? "manual-ok" : "auto-ok",
      lastError: ""
    });
    return { ok: true, at: now };
  } catch (error) {
    writeConfig({
      lastStatus: "error",
      lastError: error?.message || "Google Sheets backup failed"
    });
    return { ok: false, error };
  } finally {
    running = false;
  }
}

function scheduleBackup(reason = "change") {
  const config = readConfig();
  if (!config.enabled || !config.webhookUrl) return;
  window.clearTimeout(changeTimer);
  changeTimer = window.setTimeout(() => {
    const latest = readConfig();
    const lastAt = Date.parse(latest.lastBackupAt || "");
    const oldEnough = !Number.isFinite(lastAt) || Date.now() - lastAt > AUTO_BACKUP_INTERVAL_MS;
    const newDay = latest.lastBackupDate !== todayKey();
    if (newDay || oldEnough || reason === "start") backupToGoogleSheets();
  }, BACKUP_DEBOUNCE_MS);
}

export function startGoogleSheetsBackup() {
  if (backupTimer) return;
  scheduleBackup("start");
  window.addEventListener("clover-data-change", scheduleBackup);
  backupTimer = window.setInterval(() => scheduleBackup("interval"), AUTO_BACKUP_INTERVAL_MS);
}
