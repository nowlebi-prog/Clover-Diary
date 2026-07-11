import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppTextarea from "../../components/common/AppTextarea";
import DurationTimeline from "../../components/dashboard/DurationTimeline";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, saveAllData } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";
import WorkTimer from "./WorkTimer";
import WorkLogPanel from "./WorkLogPanel";

const today = toDateKey(new Date());
const makeId = (name) => `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function DailyPage() {
  const [data, setData] = useState(getAllData());
  const [goalTitle, setGoalTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [gratitude, setGratitude] = useState(["", "", ""]);
  const [answers, setAnswers] = useState({});
  const load = () => setData(getAllData());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const todayGratitude = useMemo(() => (data.gratitudeEntries || []).find((item) => item.date === today), [data.gratitudeEntries]);
  const durationItems = [
    ...(data.timelineEntries || []).filter((item) => item.date === today).map((item) => ({ ...item, title: item.title || "기록" })),
    ...(data.events || []).filter((item) => item.date === today).map((item) => ({ ...item, title: item.title || "일정" })),
    ...(data.timeSessions || []).filter((item) => item.date === today).map((item) => ({ ...item, time: new Date(item.startedAt).toTimeString().slice(0, 5) }))
  ];

  useEffect(() => {
    if (todayGratitude) setGratitude([0, 1, 2].map((index) => todayGratitude.items?.[index] || ""));
  }, [todayGratitude?.id]);

  const commit = (recipe) => {
    const next = getAllData();
    recipe(next);
    saveAllData(next);
    setData(next);
  };

  const addGoal = () => {
    const title = goalTitle.trim();
    if (!title) return;
    commit((next) => {
      next.goals = [{ id: makeId("goals"), title, targetDays: 7, completedDays: 0, status: "active", createdAt: today, updatedAt: today }, ...(next.goals || [])];
    });
    setGoalTitle("");
  };

  const toggleGoal = (goal) => {
    commit((next) => {
      next.goals = (next.goals || []).map((item) =>
        item.id === goal.id
          ? { ...item, completedDays: item.completedDays >= item.targetDays ? 0 : Number(item.completedDays || 0) + 1, updatedAt: today }
          : item
      );
    });
  };

  const saveGratitude = () => {
    commit((next) => {
      const entry = { id: todayGratitude?.id || makeId("gratitude"), date: today, items: gratitude, createdAt: today, updatedAt: today };
      next.gratitudeEntries = [entry, ...(next.gratitudeEntries || []).filter((item) => item.date !== today)];
    });
  };

  const addPrompt = () => {
    const text = prompt.trim();
    if (!text) return;
    commit((next) => {
      next.questionPrompts = [{ id: makeId("question"), text, active: true, createdAt: today, updatedAt: today }, ...(next.questionPrompts || [])];
    });
    setPrompt("");
  };

  const saveAnswer = (questionId) => {
    const body = (answers[questionId] || "").trim();
    if (!body) return;
    commit((next) => {
      next.questionAnswers = [
        { id: makeId("answer"), questionId, date: today, body, createdAt: today, updatedAt: today },
        ...(next.questionAnswers || []).filter((item) => !(item.questionId === questionId && item.date === today))
      ];
    });
    setAnswers((current) => ({ ...current, [questionId]: "" }));
  };

  const saveTimelineDrafts = (entries) => {
    commit((next) => {
      const savedAt = toDateKey(new Date());
      const newEntries = entries.map((entry) => ({
        id: makeId("timeline"),
        date: today,
        time: `${String(entry.hour).padStart(2, "0")}:00`,
        title: entry.title,
        memo: "",
        createdAt: savedAt,
        updatedAt: savedAt
      }));
      next.timelineEntries = [...newEntries, ...(next.timelineEntries || [])];
    });
  };

  return (
    <>
      <PageHeader eyebrow={today} title="Daily" />

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="grid gap-4">
          <DurationTimeline items={durationItems} date={today} onSaveEntries={saveTimelineDrafts} />

          <GlassCard className="bg-[#F2F0FF]/70">
            <SectionTitle>Goals</SectionTitle>
            <div className="mb-4 flex gap-2">
              <AppInput value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} placeholder="목표 항목 추가" />
              <AppButton onClick={addGoal}>추가</AppButton>
            </div>
            <div className="grid gap-3">
              {(data.goals || []).slice(0, 6).map((goal) => {
                const rate = Math.min(100, Math.round((Number(goal.completedDays || 0) / Number(goal.targetDays || 1)) * 100));
                return (
                  <button key={goal.id} onClick={() => toggleGoal(goal)} className="rounded-[22px] bg-white/70 p-4 text-left">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">{goal.title}</h3>
                        <p className="text-sm text-clover-sub">{goal.completedDays || 0} / {goal.targetDays || 7} days</p>
                      </div>
                      <b className="text-emerald-500">{rate}%</b>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white">
                      <div className="h-full rounded-full bg-emerald-400" style={{ width: `${rate}%` }} />
                    </div>
                  </button>
                );
              })}
              {!data.goals?.length && <p className="text-sm text-clover-sub">작게 이어갈 목표를 추가해보세요.</p>}
            </div>
          </GlassCard>

          <GlassCard>
            <SectionTitle>감사일기 3가지</SectionTitle>
            <div className="grid gap-2">
              {gratitude.map((value, index) => (
                <AppInput key={index} value={value} onChange={(event) => setGratitude((current) => current.map((item, i) => i === index ? event.target.value : item))} placeholder={`${index + 1}. 오늘 감사한 일`} />
              ))}
            </div>
            <AppButton className="mt-3" onClick={saveGratitude}>감사일기 저장</AppButton>
          </GlassCard>

          <GlassCard className="bg-[#FFFDF5]/80">
            <SectionTitle>나를 알아가는 질문</SectionTitle>
            <div className="mb-4 flex gap-2">
              <AppInput value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="꾸준히 답하고 싶은 질문 추가" />
              <AppButton onClick={addPrompt}>추가</AppButton>
            </div>
            <div className="grid gap-3">
              {(data.questionPrompts || []).slice(0, 5).map((item, index) => {
                const existing = (data.questionAnswers || []).find((answer) => answer.questionId === item.id && answer.date === today);
                return (
                  <article key={item.id} className="rounded-[22px] bg-white/70 p-4">
                    <p className="text-xs font-bold text-rose-400">Q. {index + 1}</p>
                    <h3 className="mt-1 font-bold">{item.text}</h3>
                    {existing && <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm">{existing.body}</p>}
                    <AppTextarea value={answers[item.id] || ""} onChange={(event) => setAnswers((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="오늘의 답을 적어보세요." />
                    <AppButton className="mt-2" variant="soft" onClick={() => saveAnswer(item.id)}>답변 저장</AppButton>
                  </article>
                );
              })}
              {!data.questionPrompts?.length && <p className="text-sm text-clover-sub">예: 깊은 고민이 생겼을 때 나는 어떻게 해결하려고 하는 편인가요?</p>}
            </div>
          </GlassCard>
        </div>

        <div className="grid content-start gap-4">
          <WorkTimer />
          <WorkLogPanel />
        </div>
      </div>
    </>
  );
}
