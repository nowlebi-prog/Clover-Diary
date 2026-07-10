import AppButton from "../../../components/common/AppButton";
import SectionTitle from "../../../components/common/SectionTitle";
import StatusBadge from "../../../components/common/StatusBadge";
export default function TodaySummaryGrid({ habitStatus, habitCircle, shopping = [], reflection, setReflection, todayReflection, onSaveReflection }) {
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
      <section className="glass rounded-[24px] bg-[#F1FBF5]/70 p-4">
        <SectionTitle>오늘 루틴</SectionTitle>
        {habitCircle}
        <div className="mt-3 flex items-center justify-between text-xs font-bold text-clover-sub">
          <span>오늘 전체 {habitStatus.doneCount}/{habitStatus.total}</span>
          <StatusBadge tone={habitStatus.rate === 100 ? "done" : "warning"}>{habitStatus.rate}%</StatusBadge>
        </div>
      </section>

      <section className="glass rounded-[24px] bg-white/60 p-4">
        <SectionTitle>구매 필요</SectionTitle>
        <div className="grid gap-1.5">
          {shopping.slice(0, 3).map((item) => (
            <p key={item.id} className="truncate rounded-2xl bg-white/55 px-3 py-2 text-sm font-bold">• {item.title}</p>
          ))}
          {shopping.length > 3 && <p className="text-xs font-bold text-clover-sub">+ {shopping.length - 3}개 더</p>}
          {!shopping.length && <p className="text-sm text-clover-sub">필요한 구매 목록이 없어요.</p>}
        </div>
      </section>

      <section className="glass rounded-[24px] bg-[#F7F4FF]/70 p-4">
        <SectionTitle>오늘 배운 한 줄</SectionTitle>
        {todayReflection && <p className="mb-2 line-clamp-2 rounded-2xl bg-white/55 p-2 text-xs">{todayReflection.body || todayReflection.memo}</p>}
        <input
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
          placeholder="오늘의 한 줄을 남겨보세요."
          className="min-h-11 w-full rounded-2xl border border-white/70 bg-white/60 px-3 text-sm outline-none focus:ring-2 focus:ring-clover-primary"
        />
        <AppButton className="mt-2 w-full" variant="soft" onClick={onSaveReflection}>저장</AppButton>
      </section>
    </div>
  );
}
