import GlassCard from "../common/GlassCard";
import StatusBadge from "../common/StatusBadge";

const money = (value) => `${Number(value || 0).toLocaleString()}원`;
const TYPE_LABEL = { sales: "매출", purchase: "매입", cashReceipt: "현금영수증" };
const TYPE_TONE = { sales: "done", purchase: "warning", cashReceipt: "blue" };

export default function RecentTaxRecordsList({ records = [] }) {
  const recent = [...records].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 8);

  return (
    <GlassCard className="p-5">
      <h2 className="mb-3 text-base font-black">최근 가져온 세금계산서 · 현금영수증</h2>
      <div className="grid gap-2">
        {recent.map((record) => (
          <div key={record.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/55 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <StatusBadge tone={TYPE_TONE[record.type]}>{TYPE_LABEL[record.type]}</StatusBadge>
                <p className="truncate text-sm font-bold">{record.partner}</p>
              </div>
              <p className="mt-1 text-[11px] font-bold text-clover-sub">{record.date} · 공급가액 {money(record.supplyAmount)} · 세액 {money(record.taxAmount)}</p>
            </div>
            <p className="shrink-0 text-sm font-black">{money(record.totalAmount)}</p>
          </div>
        ))}
        {!recent.length && <p className="rounded-2xl bg-white/45 p-3 text-sm text-clover-sub">아직 가져온 세금계산서/현금영수증이 없어요. 위에서 CSV를 업로드해보세요.</p>}
      </div>
    </GlassCard>
  );
}
