import CustomCheckbox from "../../../components/common/CustomCheckbox";
import GlassCard from "../../../components/common/GlassCard";
import SectionTitle from "../../../components/common/SectionTitle";

export default function TodayTopThree({ items = [], onToggle }) {
  return (
    <GlassCard className="bg-[#FFF8E8]/75">
      <SectionTitle>오늘 반드시 할 일</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.slice(0, 3).map((item, index) => (
          <article key={item.id} className={`rounded-[22px] border p-4 ${item.completed ? "border-clover-primary/30 bg-white/55" : "border-white/80 bg-white/70"}`}>
            <p className="mb-3 text-xs font-bold text-clover-sub">0{index + 1}</p>
            <CustomCheckbox checked={item.completed} label={item.title} onChange={(checked) => onToggle(item.id, checked)} />
          </article>
        ))}
        {!items.length && <p className="text-sm text-clover-sub">오늘 꼭 끝낼 일을 3개만 정해보세요.</p>}
      </div>
    </GlassCard>
  );
}
