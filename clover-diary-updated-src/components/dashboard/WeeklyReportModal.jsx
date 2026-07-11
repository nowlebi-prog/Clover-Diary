import { useMemo } from "react";
import AppButton from "../common/AppButton";
import StatusBadge from "../common/StatusBadge";
import { addDays, toDateKey } from "../../lib/utils/date";

const minutesToLabel = (minutes) => {
  const value = Number(minutes || 0);
  if (value < 60) return `${value}분`;
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  return rest ? `${hours}시간 ${rest}분` : `${hours}시간`;
};

const inRange = (date, start, end) => date && date >= start && date <= end;
const completionRate = (done, total) => total ? Math.round((done / total) * 100) : 0;

const moodValue = (mood = "") => {
  if (typeof mood === "number") return mood;
  const text = String(mood).toLowerCase();
  if (["great", "good", "happy", "좋음", "행복"].some((word) => text.includes(word))) return 5;
  if (["normal", "보통"].some((word) => text.includes(word))) return 3;
  if (["tired", "scattered", "bad", "sad", "힘듦", "피곤"].some((word) => text.includes(word))) return 2;
  return 3;
};

export default function WeeklyReportModal({ data, today = toDateKey(new Date()), onClose }) {
  const report = useMemo(() => {
    const start = addDays(today, -6);
    const monthStart = `${today.slice(0, 8)}01`;
    const completedTodos = (data.todos || []).filter((item) => inRange(item.completedAt, start, today));
    const openTodos = (data.todos || []).filter((item) => !item.completed);
    const delayedTodos = openTodos.filter((item) => Number(item.delayedCount || 0) > 0);
    const habitLogs = (data.habitLogs || []).filter((item) => inRange(item.date, start, today) && item.completed);
    const gratitude = (data.gratitudeEntries || []).filter((item) => inRange(item.date, start, today));
    const answers = (data.questionAnswers || []).filter((item) => inRange(item.date, start, today));
    const timeMinutes = (data.timeSessions || [])
      .filter((item) => inRange(item.date, start, today))
      .reduce((sum, item) => sum + Number(item.minutes || 0), 0);
    const goalDone = (data.goals || []).filter((item) => Number(item.completedDays || 0) >= Number(item.targetDays || 1));
    const totalTouches = completedTodos.length + habitLogs.length + gratitude.length + answers.length;
    const score = Math.min(100, completionRate(totalTouches, Math.max(8, totalTouches + delayedTodos.length)));
    const moodEntries = [
      ...(data.moodEntries || []).map((item) => ({ date: item.date, value: moodValue(item.score), label: item.detail || item.coreLabel })),
      ...(data.timelineEntries || [])
        .filter((item) => item.mood)
        .map((item) => ({ date: item.date, value: moodValue(item.mood), label: item.mood }))
    ].filter((item) => inRange(item.date, start, today));
    const monthTodos = (data.todos || []).filter((item) => inRange(item.dueDate || item.createdAt, monthStart, today) || inRange(item.completedAt, monthStart, today));
    const monthDone = monthTodos.filter((item) => item.completed || inRange(item.completedAt, monthStart, today)).length;
    const monthGoals = (data.goals || []).map((goal) => {
      const rate = completionRate(Number(goal.completedDays || 0), Number(goal.targetDays || 1));
      return { ...goal, rate };
    });
    const monthRate = monthGoals.length
      ? Math.round(monthGoals.reduce((sum, goal) => sum + goal.rate, 0) / monthGoals.length)
      : completionRate(monthDone, Math.max(1, monthTodos.length));

    return { start, monthStart, completedTodos, openTodos, delayedTodos, habitLogs, gratitude, answers, timeMinutes, goalDone, score, moodEntries, monthRate, monthDone, monthTotal: monthTodos.length, monthGoals };
  }, [data, today]);

  const cards = [
    { title: "끝낸 일", value: `${report.completedTodos.length}개`, note: "이번 주 완료한 To do" },
    { title: "루틴 체크", value: `${report.habitLogs.length}회`, note: "습관/뷰티/생활 루틴 기록" },
    { title: "집중 시간", value: minutesToLabel(report.timeMinutes), note: "타임트래커 누적" },
    { title: "나를 본 기록", value: `${report.gratitude.length + report.answers.length}개`, note: "감사일기 + 질문 답변" }
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/25 p-0 sm:place-items-center sm:p-6">
      <section className="glass max-h-[90vh] w-full overflow-auto rounded-t-[30px] p-5 sm:max-w-md sm:rounded-[30px]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-clover-deep">Weekly report</p>
            <h2 className="mt-1 text-2xl font-bold text-clover-text">이번 주 내 생활은</h2>
            <p className="mt-1 text-sm text-clover-sub">{report.start} - {today}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/60 text-clover-sub">×</button>
        </div>

        <div className="mb-4 rounded-[24px] bg-white/60 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold">이번 주 흐름</p>
            <StatusBadge tone={report.score >= 70 ? "done" : report.score >= 40 ? "warning" : "cream"}>{report.score}%</StatusBadge>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-clover-deep" style={{ width: `${report.score}%` }} />
          </div>
          <p className="mt-3 text-sm text-clover-sub">
            {report.score >= 70 ? "꽤 잘 굴러간 한 주였어요." : report.score >= 40 ? "중간중간 해낸 것들이 있어요." : "다음 주는 더 작게 시작해도 괜찮아요."}
          </p>
        </div>

        <div className="mb-4 rounded-[24px] bg-[#F7FBFF]/80 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold">이번 달 달성률</p>
            <b className="text-clover-deep">{report.monthRate}%</b>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-blue-400" style={{ width: `${report.monthRate}%` }} />
          </div>
          <p className="mt-2 text-xs text-clover-sub">목표가 있으면 목표 기준, 없으면 이번 달 To do 기준으로 계산해요.</p>
          {!!report.monthGoals.length && (
            <div className="mt-3 grid gap-2">
              {report.monthGoals.slice(0, 2).map((goal) => (
                <p key={goal.id} className="rounded-2xl bg-white/60 p-3 text-xs"><b>{goal.title}</b> · {goal.rate}%</p>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4 rounded-[24px] bg-white/60 p-4">
          <p className="mb-3 text-sm font-bold">기분 그래프</p>
          <div className="flex h-24 items-end gap-2">
            {Array.from({ length: 7 }, (_, index) => {
              const date = addDays(today, index - 6);
              const mood = report.moodEntries.find((item) => item.date === date);
              const height = `${(mood?.value || 1) * 18}%`;
              return (
                <div key={date} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t-full bg-clover-primary/70" style={{ height }} />
                  <span className="text-[10px] text-clover-sub">{new Date(`${date}T00:00:00`).getDate()}</span>
                </div>
              );
            })}
          </div>
          {!report.moodEntries.length && <p className="mt-2 text-xs text-clover-sub">Daily에서 기분을 기록하면 여기에 그래프로 보여줄게요.</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {cards.map((card) => (
            <article key={card.title} className="rounded-[22px] bg-white/65 p-4">
              <p className="text-xs font-bold text-clover-sub">{card.title}</p>
              <p className="mt-2 text-2xl font-bold text-clover-deep">{card.value}</p>
              <p className="mt-1 text-xs text-clover-sub">{card.note}</p>
            </article>
          ))}
        </div>

        <div className="mt-4 grid gap-3">
          <article className="rounded-[22px] bg-[#FFF8E8]/80 p-4">
            <p className="font-bold">다음 주로 넘길 것</p>
            <p className="mt-1 text-sm text-clover-sub">미완료 {report.openTodos.length}개 · 미룬 일 {report.delayedTodos.length}개</p>
          </article>
          {!!report.goalDone.length && (
            <article className="rounded-[22px] bg-emerald-50 p-4">
              <p className="font-bold">완료한 목표</p>
              <p className="mt-1 text-sm text-clover-sub">{report.goalDone.slice(0, 2).map((item) => item.title).join(", ")}</p>
            </article>
          )}
        </div>

        <AppButton className="mt-4 w-full" onClick={onClose}>이번 주도 저장하고 닫기</AppButton>
      </section>
    </div>
  );
}
