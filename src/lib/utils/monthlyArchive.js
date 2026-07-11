const encoder = new TextEncoder();

const money = (value) => `${Number(value || 0).toLocaleString()}원`;

const monthFilter = (field, monthKey) => (item) => String(item?.[field] || "").startsWith(monthKey);

export function collectMonthData(data, monthKey) {
  return {
    month: monthKey,
    todos: (data.todos || []).filter((item) => monthFilter("dueDate", monthKey)(item) || monthFilter("completedAt", monthKey)(item)),
    events: (data.events || []).filter(monthFilter("date", monthKey)),
    timelineEntries: (data.timelineEntries || []).filter(monthFilter("date", monthKey)),
    moodEntries: (data.moodEntries || []).filter(monthFilter("date", monthKey)),
    gratitudeEntries: (data.gratitudeEntries || []).filter(monthFilter("date", monthKey)),
    reflections: (data.reflections || []).filter(monthFilter("date", monthKey)),
    habitLogs: (data.habitLogs || []).filter(monthFilter("date", monthKey)),
    payments: (data.payments || []).filter((item) => monthFilter("expectedDate", monthKey)(item) || monthFilter("paidDate", monthKey)(item)),
    expenses: (data.expenses || []).filter(monthFilter("date", monthKey)),
    timeSessions: (data.timeSessions || []).filter(monthFilter("date", monthKey))
  };
}

export function buildMonthSummary(monthData) {
  const income = monthData.payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expenses = monthData.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const completedTodos = monthData.todos.filter((item) => item.completed).length;
  const moodAvg = monthData.moodEntries.length
    ? (monthData.moodEntries.reduce((sum, item) => sum + Number(item.score || 0), 0) / monthData.moodEntries.length).toFixed(1)
    : "0";
  const sleepAvg = monthData.moodEntries.length
    ? (monthData.moodEntries.reduce((sum, item) => sum + Number(item.sleepHours || 0), 0) / monthData.moodEntries.length).toFixed(1)
    : "0";
  return {
    income,
    expenses,
    taxReserve: Math.round(income * 0.1),
    completedTodos,
    totalTodos: monthData.todos.length,
    moodAvg,
    sleepAvg,
    journalCount: monthData.reflections.length,
    habitChecks: monthData.habitLogs.length,
    timeMinutes: monthData.timeSessions.reduce((sum, item) => sum + Number(item.minutes || 0), 0)
  };
}

export function buildReportHtml(monthData) {
  const summary = buildMonthSummary(monthData);
  const journalRows = monthData.reflections
    .map((item) => `<tr><td>${item.date}</td><td>${escapeHtml(item.body || item.memo || "")}</td></tr>`)
    .join("");
  const moodRows = monthData.moodEntries
    .map((item) => `<tr><td>${item.date}</td><td>${item.emoji || ""} ${escapeHtml(item.label || "")}</td><td>${item.score || ""}</td><td>${item.sleepHours || ""}</td><td>${escapeHtml(item.weather || "")}</td></tr>`)
    .join("");
  const todoRows = monthData.todos
    .map((item) => `<tr><td>${item.dueDate || ""}</td><td>${escapeHtml(item.title || "")}</td><td>${item.completed ? "완료" : "미완료"}</td></tr>`)
    .join("");

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>Clover Desk ${monthData.month} 리포트</title>
  <style>
    body { font-family: Arial, "Malgun Gothic", sans-serif; color: #1f2a24; padding: 32px; }
    h1 { font-size: 28px; margin-bottom: 8px; }
    h2 { margin-top: 28px; font-size: 18px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
    .card { border: 1px solid #dce8df; border-radius: 16px; padding: 14px; background: #f7fbf8; }
    .label { font-size: 11px; font-weight: 800; color: #478b64; text-transform: uppercase; }
    .value { font-size: 20px; font-weight: 900; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th, td { border-bottom: 1px solid #e7eee9; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f0f7f2; }
    @media print { button { display: none; } body { padding: 12mm; } }
  </style>
</head>
<body>
  <button onclick="window.print()" style="float:right;padding:10px 16px;border-radius:999px;border:0;background:#34895d;color:white;font-weight:800;">PDF로 저장</button>
  <h1>${monthData.month} 월간 리포트</h1>
  <p>Clover Desk에 쌓인 한 달 기록을 정리했어요.</p>
  <section class="grid">
    <div class="card"><div class="label">수입</div><div class="value">${money(summary.income)}</div></div>
    <div class="card"><div class="label">지출</div><div class="value">${money(summary.expenses)}</div></div>
    <div class="card"><div class="label">기분 평균</div><div class="value">${summary.moodAvg}점</div></div>
    <div class="card"><div class="label">수면 평균</div><div class="value">${summary.sleepAvg}시간</div></div>
    <div class="card"><div class="label">할 일</div><div class="value">${summary.completedTodos}/${summary.totalTodos}</div></div>
    <div class="card"><div class="label">루틴 체크</div><div class="value">${summary.habitChecks}회</div></div>
    <div class="card"><div class="label">기록</div><div class="value">${summary.journalCount}개</div></div>
    <div class="card"><div class="label">작업 시간</div><div class="value">${summary.timeMinutes}분</div></div>
  </section>
  <h2>기분 / 수면</h2>
  <table><thead><tr><th>날짜</th><th>기분</th><th>점수</th><th>수면</th><th>날씨</th></tr></thead><tbody>${moodRows || "<tr><td colspan='5'>기록 없음</td></tr>"}</tbody></table>
  <h2>오늘 요약</h2>
  <table><thead><tr><th>날짜</th><th>요약</th></tr></thead><tbody>${journalRows || "<tr><td colspan='2'>기록 없음</td></tr>"}</tbody></table>
  <h2>할 일</h2>
  <table><thead><tr><th>날짜</th><th>할 일</th><th>상태</th></tr></thead><tbody>${todoRows || "<tr><td colspan='3'>기록 없음</td></tr>"}</tbody></table>
</body>
</html>`;
}

export function openMonthlyPdf(monthData) {
  const reportWindow = window.open("", "_blank", "width=900,height=1100");
  if (!reportWindow) return;
  reportWindow.document.write(buildReportHtml(monthData));
  reportWindow.document.close();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function crc32(bytes) {
  let crc = -1;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}

function u16(value) {
  return [value & 255, (value >>> 8) & 255];
}

function u32(value) {
  return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255];
}

export function createZipBlob(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const contentBytes = typeof file.content === "string" ? encoder.encode(file.content) : file.content;
    const crc = crc32(contentBytes);
    const localHeader = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(crc), ...u32(contentBytes.length), ...u32(contentBytes.length), ...u16(nameBytes.length), ...u16(0),
      ...nameBytes
    ]);
    localParts.push(localHeader, contentBytes);

    const centralHeader = new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(crc), ...u32(contentBytes.length), ...u32(contentBytes.length), ...u16(nameBytes.length), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...nameBytes
    ]);
    centralParts.push(centralHeader);
    offset += localHeader.length + contentBytes.length;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length),
    ...u32(centralSize), ...u32(offset), ...u16(0)
  ]);
  return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
}

export async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

export function base64ToBlob(base64, type = "application/zip") {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function buildMonthlyArchivePackage(data, monthKey) {
  const monthData = collectMonthData(data, monthKey);
  const summary = buildMonthSummary(monthData);
  const zip = createZipBlob([
    { name: `${monthKey}/data.json`, content: JSON.stringify(monthData, null, 2) },
    { name: `${monthKey}/summary.json`, content: JSON.stringify(summary, null, 2) },
    { name: `${monthKey}/report.html`, content: buildReportHtml(monthData) }
  ]);
  return {
    monthData,
    summary,
    zip,
    base64: await blobToBase64(zip),
    filename: `clover-desk-${monthKey}.zip`
  };
}
