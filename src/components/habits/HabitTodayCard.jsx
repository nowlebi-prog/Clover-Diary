import AppButton from "../common/AppButton";
import StatusBadge from "../common/StatusBadge";

export default function HabitTodayCard({ habit, done, streak, onToggle, onEdit }) {
  return (
    <article
      className={`min-w-[210px] rounded-[24px] border p-4 transition hover:-translate-y-0.5 ${
        done ? "border-clover-primary bg-clover-mint/55" : "border-white/70 bg-white/55"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl text-sm font-black text-white" style={{ background: habit.color }}>
          {habit.icon}
        </div>
        {done && <StatusBadge tone="done">완료</StatusBadge>}
      </div>
      <h3 className="mt-4 font-bold text-clover-text">{habit.name}</h3>
      <p className="mt-1 text-xs text-clover-sub">{done ? "오늘 완료했어요" : "오늘 체크가 필요해요"}</p>
      <p className="mt-3 text-sm font-bold text-clover-deep">{streak}일 연속</p>
      <div className="mt-4 flex gap-2">
        <AppButton className="flex-1" variant={done ? "soft" : "primary"} onClick={onToggle}>{done ? "취소" : "체크"}</AppButton>
        <AppButton variant="ghost" onClick={onEdit}>수정</AppButton>
      </div>
    </article>
  );
}
