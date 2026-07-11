import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import GlassCard from "../common/GlassCard";
import { syncFromCsv } from "../../lib/integrations/hometaxProvider";

const SLOTS = [
  { kind: "sales", label: "전자세금계산서 매출", hint: "홈택스 > 조회/발급 > 매출 전자세금계산서 목록에서 CSV로 내려받아 업로드" },
  { kind: "purchase", label: "전자세금계산서 매입", hint: "홈택스 > 조회/발급 > 매입 전자세금계산서 목록에서 CSV로 내려받아 업로드" },
  { kind: "cashReceipt", label: "현금영수증", hint: "홈택스 > 현금영수증 조회에서 CSV로 내려받아 업로드" }
];

export default function HometaxImportCard({ onImported }) {
  const [status, setStatus] = useState({}); // kind -> { loading, message, tone }
  const inputRefs = useRef({});

  const handleFile = async (kind, file) => {
    if (!file) return;
    setStatus((s) => ({ ...s, [kind]: { loading: true } }));
    try {
      const result = await syncFromCsv(kind, file);
      if (!result.ok) {
        setStatus((s) => ({ ...s, [kind]: { loading: false, message: result.message, tone: "danger" } }));
        return;
      }
      setStatus((s) => ({
        ...s,
        [kind]: { loading: false, message: `${result.added}건 반영 · ${result.skipped}건 중복 제외`, tone: "done" }
      }));
      onImported?.();
    } catch (error) {
      setStatus((s) => ({ ...s, [kind]: { loading: false, message: error.message, tone: "danger" } }));
    } finally {
      if (inputRefs.current[kind]) inputRefs.current[kind].value = "";
    }
  };

  return (
    <GlassCard className="p-5">
      <div className="mb-1 flex items-center gap-2">
        <UploadCloud size={18} className="text-clover-deep" />
        <h2 className="text-base font-black">홈택스 자료 업로드</h2>
      </div>
      <p className="mb-4 text-xs font-bold text-clover-sub">CSV 파일을 올리면 날짜·거래처·금액을 자동으로 읽어서 수입/지출에 반영해요. 같은 내역은 다시 올려도 중복 반영되지 않아요.</p>

      <div className="grid gap-3">
        {SLOTS.map(({ kind, label, hint }) => {
          const s = status[kind];
          return (
            <div key={kind} className="rounded-2xl bg-white/55 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black">{label}</p>
                  <p className="mt-0.5 text-[11px] font-bold text-clover-sub">{hint}</p>
                </div>
                <label className="shrink-0 cursor-pointer rounded-full bg-clover-deep px-4 py-2 text-xs font-bold text-white hover:bg-[#31754f]">
                  {s?.loading ? "처리 중…" : "CSV 선택"}
                  <input
                    ref={(el) => (inputRefs.current[kind] = el)}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(event) => handleFile(kind, event.target.files?.[0])}
                  />
                </label>
              </div>
              {s?.message && (
                <p className={`mt-2 text-xs font-bold ${s.tone === "danger" ? "text-clover-danger" : "text-emerald-700"}`}>
                  {s.message}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
