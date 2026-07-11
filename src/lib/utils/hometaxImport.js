// 홈택스/카드사마다 컬럼명이 조금씩 달라서, 헤더 텍스트에 아래 키워드가 포함되면 매칭한다.
const FIELD_PATTERNS = {
  date: /작성일자|발급일자|승인일자|거래일자|이용일자|일자|날짜/,
  partner: /상호|거래처|가맹점|공급자|공급받는자|사업자명|매출처|매입처/,
  supplyAmount: /공급가액|공급가|과세물품가액/,
  taxAmount: /세액|부가세/,
  totalAmount: /합계금액|합계|승인금액|사용금액|결제금액|총액/,
  invoiceId: /승인번호|문서번호|일련번호|승인no|매입매출전표번호/i
};

function pickColumnIndex(headers, pattern) {
  return headers.findIndex((header) => pattern.test(header));
}

function parseAmount(raw) {
  if (raw === undefined || raw === null) return 0;
  const cleaned = String(raw).replace(/[^\d.-]/g, "");
  return cleaned ? Math.round(Number(cleaned)) : 0;
}

function normalizeDate(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  // 20260711, 2026.07.11, 2026/07/11, 2026-07-11 모두 지원
  const digitsOnly = text.replace(/[^\d]/g, "");
  if (digitsOnly.length === 8) {
    return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6, 8)}`;
  }
  const match = text.match(/(\d{4})\D(\d{1,2})\D(\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return text;
}

// headers/rows는 csvParser.parseCsvFile()의 결과. kind는 "sales" | "purchase" | "cashReceipt".
export function mapRowsToTaxRecords(headers, rows, kind) {
  const columns = {
    date: pickColumnIndex(headers, FIELD_PATTERNS.date),
    partner: pickColumnIndex(headers, FIELD_PATTERNS.partner),
    supplyAmount: pickColumnIndex(headers, FIELD_PATTERNS.supplyAmount),
    taxAmount: pickColumnIndex(headers, FIELD_PATTERNS.taxAmount),
    totalAmount: pickColumnIndex(headers, FIELD_PATTERNS.totalAmount),
    invoiceId: pickColumnIndex(headers, FIELD_PATTERNS.invoiceId)
  };

  if (columns.date === -1 || columns.partner === -1) {
    return { records: [], error: "날짜 또는 거래처 컬럼을 찾지 못했어요. CSV 헤더를 확인해주세요." };
  }

  const records = rows
    .map((row) => {
      const date = normalizeDate(row[columns.date]);
      const partner = String(row[columns.partner] || "").trim();
      let supplyAmount = columns.supplyAmount !== -1 ? parseAmount(row[columns.supplyAmount]) : 0;
      let taxAmount = columns.taxAmount !== -1 ? parseAmount(row[columns.taxAmount]) : 0;
      let totalAmount = columns.totalAmount !== -1 ? parseAmount(row[columns.totalAmount]) : 0;

      // 합계금액만 있고 공급가액/세액이 없는 경우(현금영수증 등) 부가세 10% 기준 역산
      if (!totalAmount && supplyAmount) totalAmount = supplyAmount + taxAmount;
      if (totalAmount && !supplyAmount && !taxAmount) {
        supplyAmount = Math.round(totalAmount / 1.1);
        taxAmount = totalAmount - supplyAmount;
      }

      const invoiceId = columns.invoiceId !== -1 ? String(row[columns.invoiceId] || "").trim() : "";

      return { date, partner, supplyAmount, taxAmount, totalAmount, invoiceId: invoiceId || undefined, type: kind };
    })
    .filter((record) => record.date && record.partner && record.totalAmount);

  return { records, error: null };
}
