// 홈택스/카드사 CSV는 대부분 EUC-KR(CP949)로 내려받아지므로 인코딩을 자동 판별한다.
function decodeBuffer(buffer) {
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const hasReplacementChar = utf8.includes("\uFFFD");
  if (!hasReplacementChar) return utf8;
  try {
    return new TextDecoder("euc-kr").decode(buffer);
  } catch {
    return utf8;
  }
}

// 따옴표로 감싼 필드 안의 콤마/줄바꿈까지 지원하는 최소 CSV 파서.
function parseCsvText(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("파일을 읽을 수 없어요."));
    reader.onload = () => {
      try {
        const text = decodeBuffer(reader.result);
        const rows = parseCsvText(text);
        if (!rows.length) return resolve({ headers: [], rows: [] });
        const [headerRow, ...bodyRows] = rows;
        const headers = headerRow.map((h) => h.trim());
        resolve({ headers, rows: bodyRows });
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
