import { CheckCircle2, Clock } from "lucide-react";
import GlassCard from "../common/GlassCard";
import { PROVIDERS, syncFromPopbill, syncFromBarobill, syncFromCodef } from "../../lib/integrations/hometaxProvider";

const runners = { popbill: syncFromPopbill, barobill: syncFromBarobill, codef: syncFromCodef };

function formatSyncedAt(iso) {
  if (!iso) return "아직 동기화한 적 없어요";
  const date = new Date(iso);
  return `${date.toLocaleDateString("ko-KR")} ${date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 마지막 반영`;
}

export default function HometaxStatusCard({ syncStatus }) {
  const total = Object.values(syncStatus?.counts || {}).reduce((a, b) => a + b, 0);

  return (
    <GlassCard className="bg-sky-50/60 p-5">
      <div className="mb-1 flex items-center gap-2">
        <CheckCircle2 size={18} className="text-sky-700" />
        <h2 className="text-base font-black">홈택스 연동 상태</h2>
      </div>
      <p className="mb-3 flex items-center gap-1.5 text-xs font-bold text-clover-sub">
        <Clock size={13} /> {formatSyncedAt(syncStatus?.lastSyncedAt)}
      </p>
      <p className="mb-4 text-xs font-bold text-clover-sub">지금까지 누적 반영: 매출 {syncStatus?.counts?.sales || 0}건 · 매입 {syncStatus?.counts?.purchase || 0}건 · 현금영수증 {syncStatus?.counts?.cashReceipt || 0}건 (총 {total}건)</p>

      <div className="flex flex-wrap gap-2">
        {PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            disabled={!provider.ready}
            onClick={() => provider.ready ? null : runners[provider.id]?.().then((r) => alert(r.message))}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              provider.ready ? "bg-clover-deep text-white" : "bg-white/70 text-clover-sub"
            }`}
          >
            {provider.label}{!provider.ready && " · 준비중"}
          </button>
        ))}
      </div>
    </GlassCard>
  );
}
