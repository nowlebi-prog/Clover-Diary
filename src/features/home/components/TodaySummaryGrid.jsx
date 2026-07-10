import AppButton from "../../../components/common/AppButton";
import GlassCard from "../../../components/common/GlassCard";
import SectionTitle from "../../../components/common/SectionTitle";
import StatusBadge from "../../../components/common/StatusBadge";

export default function TodaySummaryGrid({ habitStatus, shopping = [], reflection, setReflection, todayReflection, onSaveReflection }) {
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-3">
      <GlassCard>
        <SectionTitle>오늘 루틴 요약</SectionTitle>
        <p className="text-2xl font-bold text-clover-deep">{habitStatus.doneCount}/{habitStatus.total}</p>
        <div className="my-3 h-3 overflow-hidden rounded-full bg-white/60">
          <div className="h-full rounded-full bg-clover-deep" style={{ width: `${habitStatus.rate}%` }} />
        </div>
        <StatusBadge tone={habitStatus.rate === 100 ? "done" : "warning"}>{habitStatus.rate}% 완료</StatusBadge>
      </GlassCard>

      <GlassCard>
        <SectionTitle>구매 필요 항목</SectionTitle>
        <div className="grid gap-2">
          {shopping.slice(0, 4).map((item) => (
            <p key={item.id} className="rounded-2xl bg-white/55 p-3 text-sm font-bold">{item.title}</p>
          ))}
          {!shopping.length && <p className="text-sm text-clover-sub">지금 필요한 구매 항목이 없어요.</p>}
        </div>
      </GlassCard>

      <GlassCard className="bg-[#FFFDF5]/80">
        <SectionTitle>오늘의 한 줄 회고</SectionTitle>
        {todayReflection && <p className="mb-3 rounded-2xl bg-white/55 p-3 text-sm">{todayReflection.body || todayReflection.memo}</p>}
        <textarea
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
          placeholder="오늘을 한 줄로 남겨보세요."
          className="min-h-24 w-full rounded-[22px] border border-white/70 bg-white/55 p-4 text-sm outline-none focus:ring-2 focus:ring-clover-primary"
        />
        <AppButton className="mt-3 w-full" variant="soft" onClick={onSaveReflection}>저장</AppButton>
      </GlassCard>
    </div>
  );
}
