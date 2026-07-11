import { parseCsvFile } from "../utils/csvParser";
import { mapRowsToTaxRecords } from "../utils/hometaxImport";
import { importTaxRecords } from "../storage/localStorageAdapter";

// 홈택스 데이터를 가져오는 방식을 provider로 추상화해둔다.
// 지금은 "csv"만 실제로 동작하고, 나머지는 2차 확장 시 이 인터페이스에 맞춰 구현하면
// UI(HometaxImportCard 등)는 손댈 필요가 없다.

export async function syncFromCsv(kind, file) {
  const { headers, rows } = await parseCsvFile(file);
  const { records, error } = mapRowsToTaxRecords(headers, rows, kind);
  if (error) return { ok: false, message: error };
  if (!records.length) return { ok: false, message: "인식할 수 있는 거래 내역이 없어요. CSV 형식을 확인해주세요." };
  const { added, skipped } = importTaxRecords(kind, records);
  return { ok: true, added, skipped, total: records.length };
}

// ── 2차 확장 스텁 ──
// 실제 구현 시: 프론트에서 API 키를 절대 다루지 않고, 아래처럼 자체 서버 라우트(/api/hometax-sync)를
// 호출해서 서버(Vercel Serverless Function)가 Popbill/Barobill/CODEF API를 대신 호출하게 한다.
// 인증정보는 Vercel Environment Variables(예: POPBILL_LINK_ID, POPBILL_SECRET_KEY)에만 저장한다.
async function callServerSync(provider, payload) {
  const response = await fetch("/api/hometax-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, ...payload })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `서버 동기화 요청이 실패했어요 (${response.status})`);
  }
  return response.json();
}

export async function syncFromPopbill() {
  return { ok: false, message: "Popbill 연동은 준비 중이에요. 지금은 CSV 업로드를 이용해주세요.", pending: true };
  // 구현 예시: return callServerSync("popbill", {});
}

export async function syncFromBarobill() {
  return { ok: false, message: "Barobill 연동은 준비 중이에요. 지금은 CSV 업로드를 이용해주세요.", pending: true };
}

export async function syncFromCodef() {
  return { ok: false, message: "CODEF 연동은 준비 중이에요. 지금은 CSV 업로드를 이용해주세요.", pending: true };
}

export const PROVIDERS = [
  { id: "csv", label: "CSV 업로드", ready: true },
  { id: "popbill", label: "Popbill", ready: false },
  { id: "barobill", label: "Barobill", ready: false },
  { id: "codef", label: "CODEF", ready: false }
];
