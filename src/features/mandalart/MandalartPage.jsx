import { useEffect, useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import PageHeader from "../../components/layout/PageHeader";

const STORAGE_KEY = "clover-desk:mandalart:v1";
const themeSlots = [0, 1, 2, 3, "center", 4, 5, 6, 7];
const cellSlots = [0, 1, 2, 3, "center", 4, 5, 6, 7];
const palette = [
  { border: "border-amber-300", bg: "bg-amber-50", strong: "bg-amber-100 text-amber-700", focus: "focus:ring-amber-300" },
  { border: "border-sky-300", bg: "bg-sky-50", strong: "bg-sky-100 text-sky-700", focus: "focus:ring-sky-300" },
  { border: "border-emerald-300", bg: "bg-emerald-50", strong: "bg-emerald-100 text-emerald-700", focus: "focus:ring-emerald-300" },
  { border: "border-pink-300", bg: "bg-pink-50", strong: "bg-pink-100 text-pink-700", focus: "focus:ring-pink-300" },
  { border: "border-orange-300", bg: "bg-orange-50", strong: "bg-orange-100 text-orange-700", focus: "focus:ring-orange-300" },
  { border: "border-indigo-300", bg: "bg-indigo-50", strong: "bg-indigo-100 text-indigo-700", focus: "focus:ring-indigo-300" },
  { border: "border-violet-300", bg: "bg-violet-50", strong: "bg-violet-100 text-violet-700", focus: "focus:ring-violet-300" },
  { border: "border-rose-300", bg: "bg-rose-50", strong: "bg-rose-100 text-rose-700", focus: "focus:ring-rose-300" }
];

const emptyPlan = {
  mainGoal: "",
  themes: Array.from({ length: 8 }, () => ({ title: "", tasks: Array.from({ length: 8 }, () => "") }))
};

const loadPlan = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyPlan;
    const parsed = JSON.parse(raw);
    return {
      mainGoal: parsed.mainGoal || "",
      themes: Array.from({ length: 8 }, (_, index) => ({
        title: parsed.themes?.[index]?.title || "",
        tasks: Array.from({ length: 8 }, (__, taskIndex) => parsed.themes?.[index]?.tasks?.[taskIndex] || "")
      }))
    };
  } catch {
    return emptyPlan;
  }
};

function MandalartInput({ value, placeholder, className = "", onChange }) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      rows={2}
      className={`grid h-full min-h-14 w-full resize-none place-items-center rounded-lg border border-white/70 bg-white/72 px-2 py-2 text-center text-[11px] font-bold leading-snug text-clover-ink outline-none transition placeholder:text-clover-sub/45 focus:ring-2 md:text-xs ${className}`}
    />
  );
}

function MandalartBlock({ color, title, tasks, onTitleChange, onTaskChange, isCore, mainGoal, onMainGoalChange }) {
  return (
    <div className={`rounded-[16px] border-2 ${color.border} ${color.bg} p-1.5 shadow-sm`}>
      <div className="grid grid-cols-3 gap-1.5">
        {cellSlots.map((slot, index) => {
          if (slot === "center") {
            return (
              <MandalartInput
                key="center"
                value={isCore ? mainGoal : title}
                placeholder={isCore ? "핵심 목표" : "방향"}
                onChange={isCore ? onMainGoalChange : onTitleChange}
                className={`${color.strong} min-h-16 border-transparent text-[12px] font-black md:text-sm ${color.focus}`}
              />
            );
          }
          return (
            <MandalartInput
              key={slot}
              value={isCore ? tasks[slot] : tasks[slot]}
              placeholder={isCore ? `방향 ${index + 1}` : `실천 ${index + 1}`}
              onChange={(value) => onTaskChange(slot, value)}
              className={color.focus}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function MandalartPage() {
  const [plan, setPlan] = useState(loadPlan);
  const [savedAt, setSavedAt] = useState("");
  const coreTasks = useMemo(() => plan.themes.map((theme) => theme.title), [plan.themes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }, [plan]);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    setSavedAt(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
  };

  const updateMainGoal = (mainGoal) => setPlan((current) => ({ ...current, mainGoal }));
  const updateThemeTitle = (themeIndex, title) => {
    setPlan((current) => ({
      ...current,
      themes: current.themes.map((theme, index) => index === themeIndex ? { ...theme, title } : theme)
    }));
  };
  const updateThemeTask = (themeIndex, taskIndex, value) => {
    setPlan((current) => ({
      ...current,
      themes: current.themes.map((theme, index) =>
        index === themeIndex
          ? { ...theme, tasks: theme.tasks.map((task, innerIndex) => innerIndex === taskIndex ? value : task) }
          : theme
      )
    }));
  };

  return (
    <>
      <PageHeader eyebrow="Mandalart" title="만다라트 계획표">
        <div className="flex flex-wrap items-center gap-2">
          {savedAt && <span className="text-xs font-bold text-clover-sub">{savedAt} 저장됨</span>}
          <AppButton onClick={save}>저장</AppButton>
        </div>
      </PageHeader>

      <section className="glass rounded-[24px] bg-white/72 p-4">
        <div className="mb-4">
          <h2 className="text-base font-black text-clover-ink">🎯 만다라트 계획표</h2>
          <p className="mt-1 text-xs font-bold text-clover-sub">
            중앙에 핵심 목표를 쓰고, 주변 8칸에 방향을 적어주세요. 각 방향마다 8개의 실천 과제를 채우면 전체 계획이 완성돼요.
          </p>
        </div>

        <div className="grid gap-2 lg:grid-cols-3">
          {themeSlots.map((slot) => {
            if (slot === "center") {
              return (
                <MandalartBlock
                  key="center"
                  color={{ border: "border-clover-deep", bg: "bg-clover-mint/25", strong: "bg-clover-deep text-white", focus: "focus:ring-clover-primary" }}
                  isCore
                  title=""
                  tasks={coreTasks}
                  mainGoal={plan.mainGoal}
                  onMainGoalChange={updateMainGoal}
                  onTaskChange={(taskIndex, value) => updateThemeTitle(taskIndex, value)}
                />
              );
            }
            return (
              <MandalartBlock
                key={slot}
                color={palette[slot]}
                title={plan.themes[slot].title}
                tasks={plan.themes[slot].tasks}
                onTitleChange={(value) => updateThemeTitle(slot, value)}
                onTaskChange={(taskIndex, value) => updateThemeTask(slot, taskIndex, value)}
              />
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl bg-slate-100/70 px-4 py-3 text-xs font-bold leading-relaxed text-clover-sub">
          사용법: 가운데 칸의 8개 방향을 먼저 채우면 주변 블록 제목도 같이 바뀌어요. 주변 블록에는 그 방향을 이루기 위한 구체적인 실천 과제를 입력하면 됩니다.
        </div>
      </section>
    </>
  );
}
