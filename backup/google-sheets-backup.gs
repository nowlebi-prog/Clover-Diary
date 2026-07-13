const LOG_SHEET = "_backup_log";
const RAW_SHEET = "_raw_snapshot";

function doPost(e) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);

  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const backupDate = payload.backupDate || Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd");
    const createdAt = payload.createdAt || new Date().toISOString();
    const collections = Array.isArray(payload.collections) ? payload.collections : [];

    writeLogSheet_(spreadsheet, payload, backupDate, createdAt);
    writeRawSheet_(spreadsheet, payload, backupDate, createdAt);

    collections.forEach((collection) => {
      writeCollectionSheet_(spreadsheet, collection.name, collection.rows || []);
    });

    return json_({ ok: true, backupDate, createdAt, sheetCount: collections.length });
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message ? error.message : error) });
  } finally {
    lock.releaseLock();
  }
}

function writeLogSheet_(spreadsheet, payload, backupDate, createdAt) {
  const sheet = getOrCreateSheet_(spreadsheet, LOG_SHEET);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["createdAt", "backupDate", "todos", "events", "expenses", "habits", "moodEntries", "workSessions", "rawLength"]);
  }

  const summary = payload.summary || {};
  sheet.appendRow([
    createdAt,
    backupDate,
    summary.todos || 0,
    summary.events || 0,
    summary.expenses || 0,
    summary.habits || 0,
    summary.moodEntries || 0,
    summary.workSessions || 0,
    JSON.stringify(payload.rawData || {}).length
  ]);
}

function writeRawSheet_(spreadsheet, payload, backupDate, createdAt) {
  const sheet = getOrCreateSheet_(spreadsheet, RAW_SHEET);
  sheet.clearContents();
  sheet.appendRow(["createdAt", "backupDate", "rawJson"]);
  sheet.appendRow([createdAt, backupDate, JSON.stringify(payload.rawData || {})]);
  sheet.autoResizeColumns(1, 2);
}

function writeCollectionSheet_(spreadsheet, name, rows) {
  if (!name) return;
  const sheet = getOrCreateSheet_(spreadsheet, safeSheetName_(name));
  sheet.clearContents();

  if (!rows.length) {
    sheet.appendRow(["empty"]);
    sheet.appendRow([""]);
    return;
  }

  const headers = Array.from(rows.reduce((set, row) => {
    Object.keys(row || {}).forEach((key) => set.add(key));
    return set;
  }, new Set()));

  sheet.appendRow(headers);
  rows.forEach((row) => {
    sheet.appendRow(headers.map((header) => row[header] == null ? "" : row[header]));
  });
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, Math.min(headers.length, 12));
}

function getOrCreateSheet_(spreadsheet, name) {
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function safeSheetName_(name) {
  return String(name).replace(/[\\/?*[\]:]/g, "_").slice(0, 90);
}

function json_(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
