import GlassCard from "../common/GlassCard";
import SectionLink from "./SectionLink";

const won = (value) => `${Number(value || 0).toLocaleString()}원`;

export default function BudgetSummaryCard({ summary }) {
  const { income, expense, remaining, usageRate, topCategory } = summary;
  return (
    <GlassCard className="bg-amber-50/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-700">Budget</p>
          <h2 className="text-base font-black">이번달 예산 요약</h2>
        </div>
        <SectionLink to="/money" />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-white/60 px-2 py-3">
          <p className="text-[11px] font-bold text-clover-sub">수입</p>
          <p className="mt-1 text-sm font-black text-clover-deep">{won(income)}</p>
        </div>
        <div className="rounded-2xl bg-white/60 px-2 py-3">
          <p className="text-[11px] font-bold text-clover-sub">지출</p>
          <p className="mt-1 text-sm font-black text-clover-coralDeep">{won(expense)}</p>
        </div>
        <div className="rounded-2xl bg-white/60 px-2 py-3">
          <p className="text-[11px] font-bold text-clover-sub">남은 예산</p>
          <p className="mt-1 text-sm font-black">{won(remaining)}</p>
        </div>
      </div>

      {usageRate !== null && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-clover-sub">
            <span>예산 사용률</span>
            <span>{usageRate}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/70">
            <div className={`h-1.5 rounded-full ${usageRate > 90 ? "bg-red-400" : "bg-amber-400"}`} style={{ width: `${Math.min(usageRate, 100)}%` }} />
          </div>
        </div>
      )}

      {topCategory && (
        <p className="mt-3 text-[11px] font-bold text-clover-sub">
          가장 많이 쓴 카테고리 · {topCategory.name} ({won(topCategory.amount)})
        </p>
      )}
    </GlassCard>
  );
}
