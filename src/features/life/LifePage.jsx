import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import StarRating from "../../components/common/StarRating";
import PageHeader from "../../components/layout/PageHeader";
import LifeHabitTracker from "../../components/habits/LifeHabitTracker";
import { addDays, getHabitCompletionRate, getTodayHabitStatus, isHabitDoneOn, toDateKey } from "../../lib/utils/habitSelectors";
import { shoppingCategories } from "../../lib/utils/shoppingConstants";
import {
  createChore,
  createShoppingItem,
  deleteChore,
  deleteShoppingItem,
  getChores,
  getAllData,
  getShoppingItems,
  saveAllData,
  toggleHabitLog as toggleHabit,
  updateChore,
  updateShoppingItem
} from "../../lib/storage/localStorageAdapter";

const choreIcons = ["🧺", "🗑️", "🍳", "🧽", "🧹", "⭐"];
const weekDays = ["월", "화", "수", "목", "금", "토", "일"];
const emptyChore = (today) => ({ title: "", icon: "🧺", cycle: "매주", nextDueDate: today, days: [], completed: false });
const emptyShopping = () => ({ title: "", category: "생활용품", completed: false, memo: "", importance: 0, price: "" });
const moodOptions = [
  { score: 1, label: "매우 나쁨", face: "\u{1F622}" },
  { score: 2, label: "나쁨", face: "\u{1F61F}" },
  { score: 3, label: "보통", face: "\u{1F610}" },
  { score: 4, label: "좋음", face: "\u{1F642}" },
  { score: 5, label: "매우 좋음", face: "\u{1F604}" }
];

const nextDueDate = (chore, today) => {
  if (chore.cycle === "매일") return addDays(today, 1);
  if (chore.cycle === "매주") return addDays(today, 7);
  if (chore.cycle === "매달") {
    const date = new Date(`${today}T00:00:00`);
    date.setMonth(date.getMonth() + 1);
    return toDateKey(date);
  }
  return chore.nextDueDate || today;
};

function LifeTabs({ value, onChange }) {
  const tabs = [["overview", "개요"], ["journal", "하루 기록"], ["habits", "습관 기록"], ["chores", "집안일"], ["mandalart", "만다라트"]];
  return (
    <div className="mb-4 flex w-fit rounded-full bg-white/55 p-1 shadow-sm">
      {tabs.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`rounded-full px-4 py-2 text-sm font-black transition ${value === key ? "bg-clover-deep text-white shadow-sm" : "text-clover-sub hover:bg-white/70"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
function TodayChoreOverview({ chores, today, onDone, onPostpone, onManage }) {
  const dueChores = chores
    .filter((item) => !item.archived && item.lastDoneAt !== today && (!item.nextDueDate || item.nextDueDate <= today))
    .slice(0, 5);

  return (
    <GlassCard>
      <SectionTitle>오늘 할 집안일</SectionTitle>
      <div className="grid gap-2">
        {dueChores.map((chore) => (
          <article key={chore.id} className="flex items-center gap-3 rounded-[18px] bg-white/60 p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-100 text-xl">{chore.icon || "🧺"}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-black text-clover-text">{chore.title}</p>
              <p className="text-xs font-bold text-clover-sub">{chore.postponedAt === today ? "오늘 다시 보기로 미뤄둠" : `${chore.cycle || "필요할 때"} 루틴`}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => onDone(chore)} className="rounded-full bg-clover-deep px-3 py-2 text-xs font-black text-white">했어요!</button>
              <button type="button" onClick={() => onPostpone(chore)} className="rounded-full bg-white px-3 py-2 text-xs font-black text-clover-sub">미룰게요</button>
            </div>
          </article>
        ))}
        {!dueChores.length && (
          <div className="rounded-[18px] bg-white/45 p-4">
            <p className="text-sm font-bold text-clover-sub">오늘은 정해진 집안일이 없어요. 집안일을 추가해볼까요?</p>
            <AppButton className="mt-3" variant="soft" onClick={onManage}>집안일 추가</AppButton>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function ConditionSummaryCard({ data, today, onOpenJournal }) {
  const mood = (data.moodEntries || []).find((item) => item.date === today);
  const reflection = (data.reflections || []).find((item) => item.date === today);
  const gratitude = (data.gratitudeEntries || []).find((item) => item.date === today);
  const moodOption = moodOptions.find((item) => item.score === Number(mood?.score)) || moodOptions[2];
  const gratitudeCount = (gratitude?.items || []).filter(Boolean).length;

  return (
    <GlassCard className="rounded-[22px] bg-white/84 p-5">
      <SectionTitle action={<button type="button" onClick={onOpenJournal} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-clover-deep">하루 기록 열기</button>}>
        오늘 컨디션 기록
      </SectionTitle>
      <div className="grid gap-3">
        <div>
          <p className="text-xs font-black text-clover-sub">기분 점수</p>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {moodOptions.map((option) => {
              const selected = Number(mood?.score || 0) === option.score;
              return (
                <button
                  key={option.score}
                  type="button"
                  onClick={onOpenJournal}
                  className={`rounded-2xl border px-2 py-3 text-center transition ${selected ? "border-clover-deep bg-emerald-50" : "border-clover-line bg-white/60 hover:bg-white"}`}
                >
                  <span className="block text-xl">{option.face}</span>
                  <span className="mt-1 block text-xs font-black text-clover-ink">{option.score}</span>
                  <span className="block truncate text-[10px] font-bold text-clover-sub">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={onOpenJournal} className="rounded-2xl bg-white/60 p-3 text-left">
            <p className="text-xs font-black text-clover-sub">수면 시간</p>
            <p className="mt-1 text-lg font-black text-clover-ink">{mood?.sleepHours ? `${mood.sleepHours} 시간` : "미기록"}</p>
          </button>
          <button type="button" onClick={onOpenJournal} className="rounded-2xl bg-white/60 p-3 text-left">
            <p className="text-xs font-black text-clover-sub">날씨</p>
            <p className="mt-1 truncate text-lg font-black text-clover-ink">{mood?.weather || "미기록"}</p>
          </button>
          <button type="button" onClick={onOpenJournal} className="rounded-2xl bg-white/60 p-3 text-left">
            <p className="text-xs font-black text-clover-sub">감사일기</p>
            <p className="mt-1 text-lg font-black text-clover-ink">{gratitudeCount}/3개</p>
          </button>
        </div>
        <button type="button" onClick={onOpenJournal} className="rounded-2xl bg-white/60 p-4 text-left">
          <p className="text-xs font-black text-clover-deep">오늘 요약</p>
          <p className="mt-2 line-clamp-2 text-sm font-bold text-clover-text">{reflection?.body || reflection?.memo || `${moodOption.label} 컨디션이에요. 오늘 요약을 남겨보세요.`}</p>
        </button>
        <AppButton onClick={onOpenJournal}>오늘 기록 저장/수정</AppButton>
      </div>
    </GlassCard>
  );
}

function TodayRoutineCard({ data, today, onChange, onManage }) {
  const status = getTodayHabitStatus(data.habits || [], data.habitLogs || [], today);
  const items = status.items || [];
  const toggle = (habitId) => {
    toggleHabit(habitId, today);
    onChange?.();
  };

  return (
    <GlassCard>
      <SectionTitle action={<span className="text-sm font-black text-clover-deep">{status.doneCount || 0}/{status.total || 0} 완료</span>}>오늘 루틴</SectionTitle>
      <div className="grid gap-2">
        {items.slice(0, 6).map((item) => (
          <article key={item.id} className="flex items-center gap-3 rounded-[16px] bg-white/60 px-3 py-2.5">
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-black ${item.done ? "border-clover-deep bg-clover-deep text-white" : "border-clover-line bg-white"}`}
            >
              {item.done ? "✓" : ""}
            </button>
            <span className="text-lg">{item.icon || "✓"}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-clover-text">{item.name}</p>
              <p className="text-[11px] font-bold text-clover-sub">{item.done ? "완료" : "오늘 체크 필요"}</p>
            </div>
            <button type="button" onClick={onManage} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-clover-sub">수정</button>
            <button type="button" onClick={() => toggle(item.id)} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-clover-sub">건너뛰기</button>
          </article>
        ))}
        {!items.length && (
          <div className="rounded-[16px] bg-white/45 p-4">
            <p className="text-sm font-bold text-clover-sub">오늘 체크할 루틴이 없어요.</p>
            <AppButton className="mt-3" variant="soft" onClick={onManage}>루틴 추가</AppButton>
          </div>
        )}
      </div>
      <button type="button" onClick={onManage} className="mt-3 text-sm font-black text-clover-deep">+ 루틴 관리</button>
    </GlassCard>
  );
}

function RecentLifeRecords({ data, today, onOpenJournal }) {
  const entries = [...(data.moodEntries || [])]
    .filter((item) => item.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <GlassCard>
      <SectionTitle action={<button type="button" onClick={onOpenJournal} className="text-xs font-black text-clover-deep">전체 보기</button>}>최근 생활 기록</SectionTitle>
      <div className="grid gap-1">
        {entries.map((entry) => {
          const reflection = (data.reflections || []).find((item) => item.date === entry.date);
          const mood = moodOptions.find((item) => item.score === Number(entry.score)) || moodOptions[2];
          return (
            <article key={entry.id} className="grid grid-cols-[38px_92px_1fr] items-center gap-3 border-b border-clover-line/60 py-3 last:border-0">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-lg">{entry.emoji || mood.face}</span>
              <b className="text-sm text-clover-ink">{entry.date.slice(5).replace("-", "월 ")}일</b>
              <p className="min-w-0 truncate text-sm font-bold text-clover-sub">기분 {entry.score || "-"}점 · 수면 {entry.sleepHours || 0}시간 · {reflection?.body || reflection?.memo || entry.weather || "요약 없음"}</p>
            </article>
          );
        })}
        {!entries.length && <p className="rounded-[16px] bg-white/45 p-4 text-sm font-bold text-clover-sub">아직 생활 기록이 없어요. 오늘 기록부터 남겨보세요.</p>}
      </div>
    </GlassCard>
  );
}

function ShoppingQuickAdd({ items, draft, setDraft, onAdd, onToggle }) {
  const openItems = items.filter((item) => !item.completed).slice(0, 4);
  return (
    <GlassCard>
      <SectionTitle>구매 항목</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-[1fr_110px_110px_auto]">
        <AppInput value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="예: 세탁세제" />
        <AppSelect value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
          {shoppingCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </AppSelect>
        <AppInput type="number" value={draft.price || ""} onChange={(event) => setDraft({ ...draft, price: event.target.value })} placeholder="가격" />
        <AppButton onClick={onAdd}>추가</AppButton>
      </div>
      <div className="mt-3 grid gap-2">
        {openItems.map((item) => (
          <article key={item.id} className="flex items-center gap-2 rounded-[14px] bg-white/70 px-3 py-2 text-sm font-bold text-clover-text">
            <button type="button" onClick={() => onToggle(item)} className="h-4 w-4 shrink-0 rounded-full border border-clover-deep" aria-label="구매 완료" />
            <span className="min-w-0 flex-1 truncate">{item.title}</span>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-clover-deep">{item.category}</span>
            {!!Number(item.price) && <span className="text-xs font-black text-clover-sub">{Number(item.price).toLocaleString()}원</span>}
          </article>
        ))}
        {!openItems.length && <p className="text-sm font-bold text-clover-sub">필요한 구매 항목을 바로 적어둘 수 있어요.</p>}
      </div>
    </GlassCard>
  );
}

function TodayRecordGraph({ entries, today }) {
  const entryByDate = (entries || []).reduce((map, item) => ({ ...map, [item.date]: item }), {});
  const days = Array.from({ length: 14 }, (_, index) => addDays(today, index - 13));
  const hasRecord = days.some((date) => entryByDate[date]);
  const points = days.map((date, index) => {
    const entry = entryByDate[date] || {};
    const mood = Math.max(0, Math.min(5, Number(entry.score || 0)));
    const sleep = Math.max(0, Math.min(12, Number(entry.sleepHours || 0)));
    const x = 36 + index * (428 / 13);
    return {
      date,
      mood,
      sleep,
      x,
      moodY: mood ? 172 - mood * 28 : null,
      sleepY: sleep ? 172 - sleep * 11 : null
    };
  });
  const recent = days.slice(-3).map((date) => entryByDate[date]).filter(Boolean);
  const avgMood = recent.length ? (recent.reduce((sum, item) => sum + Number(item.score || 0), 0) / recent.length).toFixed(1) : "-";
  const avgSleep = recent.length ? (recent.reduce((sum, item) => sum + Number(item.sleepHours || 0), 0) / recent.length).toFixed(1) : "-";
  const moodPath = points.filter((point) => point.moodY !== null).map((point, index) => `${index ? "L" : "M"}${point.x} ${point.moodY}`).join(" ");
  const sleepPath = points.filter((point) => point.sleepY !== null).map((point, index) => `${index ? "L" : "M"}${point.x} ${point.sleepY}`).join(" ");

  return (
    <GlassCard className="rounded-[22px] bg-white/82 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionTitle>기분 & 수면 흐름 14일</SectionTitle>
          <p className="text-sm font-bold text-clover-sub">최근 평균 수면 {avgSleep}시간 · 기분 평균 {avgMood}점</p>
        </div>
        <div className="flex shrink-0 gap-3 text-xs font-black text-clover-sub">
          <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-600" />기분</span>
          <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-sky-400" />수면</span>
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl bg-white/60 p-3">
        {hasRecord ? (
          <svg viewBox="0 0 500 220" className="h-56 w-full">
            {[1, 2, 3, 4, 5].map((value) => (
              <g key={value}>
                <line x1="28" x2="476" y1={172 - value * 28} y2={172 - value * 28} stroke="#E7F0EA" strokeWidth="1" />
                <text x="10" y={176 - value * 28} fontSize="10" fill="#7A8A81">{value}</text>
              </g>
            ))}
            <path d={moodPath} fill="none" stroke="#23845C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d={sleepPath} fill="none" stroke="#5B9BE8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((point) => (
              <g key={point.date}>
                {point.date === today && <rect x={point.x - 13} y="20" width="26" height="166" rx="13" fill="#DFF7EA" />}
                {point.moodY !== null && <circle cx={point.x} cy={point.moodY} r="4.5" fill="#23845C" />}
                {point.sleepY !== null && <circle cx={point.x} cy={point.sleepY} r="4.5" fill="#5B9BE8" />}
                <text x={point.x} y="202" textAnchor="middle" fontSize="10" fontWeight="700" fill={point.date === today ? "#23845C" : "#7A8A81"}>{Number(point.date.slice(-2))}</text>
              </g>
            ))}
          </svg>
        ) : (
          <div className="grid h-48 place-items-center text-sm font-bold text-clover-sub">아직 기록이 없어요. 하루 기록 탭에서 첫 기록을 남겨보세요.</div>
        )}
      </div>
    </GlassCard>
  );
}

const makeId = (name) => `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function LifeJournalDetails({ data, today, onChange }) {
  const [selectedDate, setSelectedDate] = useState(today);
  const dateTabs = [addDays(today, -2), addDays(today, -1), today];
  const mood = (data.moodEntries || []).find((item) => item.date === selectedDate);
  const reflection = (data.reflections || []).find((item) => item.date === selectedDate);
  const gratitudeEntry = (data.gratitudeEntries || []).find((item) => item.date === selectedDate);
  const [score, setScore] = useState(mood?.score || 3);
  const [moodLabel, setMoodLabel] = useState(mood?.label || moodOptions.find((item) => item.score === Number(mood?.score))?.label || "보통");
  const [sleepHours, setSleepHours] = useState(mood?.sleepHours || "");
  const [weather, setWeather] = useState(mood?.weather || "");
  const [summary, setSummary] = useState(reflection?.body || reflection?.memo || "");
  const [gratitude, setGratitude] = useState([0, 1, 2].map((index) => gratitudeEntry?.items?.[index] || ""));
  const [photos, setPhotos] = useState(mood?.photos || []);

  useEffect(() => {
    setScore(mood?.score || 3);
    setMoodLabel(mood?.label || moodOptions.find((item) => item.score === Number(mood?.score))?.label || "보통");
    setSleepHours(mood?.sleepHours || "");
    setWeather(mood?.weather || "");
    setSummary(reflection?.body || reflection?.memo || "");
    setGratitude([0, 1, 2].map((index) => gratitudeEntry?.items?.[index] || ""));
    setPhotos(mood?.photos || []);
  }, [selectedDate, mood?.id, reflection?.id, gratitudeEntry?.id]);

  const handlePhotoUpload = (files) => {
    Array.from(files || []).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos((current) => [
          ...current,
          { id: makeId("photo"), name: file.name, src: reader.result, createdAt: selectedDate }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const save = () => {
    const next = getAllData();
    const selectedMood = moodOptions.find((item) => item.score === Number(score)) || moodOptions[2];
    const record = {
      id: mood?.id || makeId("dailyRecord"),
      date: selectedDate,
      mood: moodLabel,
      moodScore: Number(score) || 3,
      sleepHours: Number(sleepHours) || 0,
      weather: weather.trim(),
      summary: summary.trim(),
      gratitudeList: gratitude,
      photoUrl: photos[0]?.src || "",
      photos,
      createdAt: mood?.createdAt || selectedDate,
      updatedAt: today
    };
    next.moodEntries = [
      {
        id: mood?.id || makeId("mood"),
        date: selectedDate,
        mood: moodLabel,
        emoji: selectedMood.face,
        label: moodLabel,
        color: "#E7F0EA",
        score: Number(score) || 3,
        sleepHours: Number(sleepHours) || 0,
        weather: weather.trim(),
        photos,
        createdAt: mood?.createdAt || selectedDate,
        updatedAt: today
      },
      ...(next.moodEntries || []).filter((item) => item.date !== selectedDate)
    ];
    next.reflections = [
      {
        id: reflection?.id || makeId("reflection"),
        date: selectedDate,
        title: "오늘 요약",
        body: summary.trim(),
        memo: summary.trim(),
        createdAt: reflection?.createdAt || selectedDate,
        updatedAt: today
      },
      ...(next.reflections || []).filter((item) => item.date !== selectedDate)
    ];
    next.gratitudeEntries = [
      {
        id: gratitudeEntry?.id || makeId("gratitude"),
        date: selectedDate,
        items: gratitude,
        createdAt: gratitudeEntry?.createdAt || selectedDate,
        updatedAt: today
      },
      ...(next.gratitudeEntries || []).filter((item) => item.date !== selectedDate)
    ];
    next.dailyRecords = [record, ...(next.dailyRecords || []).filter((item) => item.date !== selectedDate)];
    saveAllData(next);
    onChange?.();
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
      <GlassCard>
        <SectionTitle>하루 기록</SectionTitle>
        <div className="mb-4 grid gap-2">
          <AppInput type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          <div className="grid grid-cols-3 gap-2">
            {dateTabs.map((date) => {
              const label = date === today ? "오늘" : date === addDays(today, -1) ? "어제" : "그제";
              const hasRecord = (data.moodEntries || []).some((item) => item.date === date) || (data.reflections || []).some((item) => item.date === date);
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={`rounded-2xl px-3 py-2 text-xs font-black transition ${selectedDate === date ? "bg-clover-deep text-white" : "bg-white/70 text-clover-sub"}`}
                >
                  {label}
                  {hasRecord && <span className="ml-1">•</span>}
                </button>
              );
            })}
          </div>
        </div>
        <TodayRecordGraph entries={data.moodEntries || []} today={selectedDate} />
      </GlassCard>
      <GlassCard>
        <SectionTitle action={<AppButton onClick={save}>저장</AppButton>}>{selectedDate} 기록 작성</SectionTitle>
        <div className="grid gap-3">
          <div>
            <p className="mb-2 text-sm font-bold">기분 선택</p>
            <div className="grid grid-cols-5 gap-2">
              {moodOptions.map((option) => (
                <button
                  key={option.score}
                  type="button"
                  onClick={() => { setScore(option.score); setMoodLabel(option.label); }}
                  className={`rounded-2xl border px-2 py-3 ${Number(score) === option.score ? "border-clover-deep bg-emerald-50" : "border-clover-line bg-white/60"}`}
                >
                  <span className="block text-xl">{option.face}</span>
                  <span className="block text-[11px] font-black">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm font-bold">
            기분 점수 1-5
            <AppInput type="number" min="1" max="5" step="0.5" value={score} onChange={(event) => setScore(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            수면 시간
            <AppInput type="number" min="0" max="24" step="0.5" value={sleepHours} onChange={(event) => setSleepHours(event.target.value)} placeholder="예: 7.5" />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            날씨
            <AppInput value={weather} onChange={(event) => setWeather(event.target.value)} placeholder="맑음, 비, 흐림" />
          </label>
        </div>
        <div className="mt-3 grid gap-3">
          <AppTextarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="오늘 하루를 짧게 정리해보세요." />
          {gratitude.map((item, index) => (
            <AppInput key={index} value={item} onChange={(event) => setGratitude((current) => current.map((value, i) => (i === index ? event.target.value : value)))} placeholder={`${index + 1}. 오늘 감사한 일`} />
          ))}
          <label className="grid gap-2 rounded-2xl border border-dashed border-clover-line bg-white/45 p-4 text-sm font-bold text-clover-deep">
            사진 업로드
            <input type="file" accept="image/*" multiple onChange={(event) => handlePhotoUpload(event.target.files)} className="text-sm text-clover-sub" />
          </label>
          {!!photos.length && (
            <div className="grid grid-cols-4 gap-2">
              {photos.map((photo) => (
                <button key={photo.id} type="button" onClick={() => setPhotos((current) => current.filter((item) => item.id !== photo.id))} className="aspect-square overflow-hidden rounded-2xl bg-white/60">
                  <img src={photo.src} alt={photo.name || "오늘 사진"} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function LifeMandalartDetails({ onChange }) {
  const [goal, setGoal] = useState("");

  useEffect(() => {
    try {
      setGoal(JSON.parse(localStorage.getItem("clover-desk:mandalart:v1") || "{}").mainGoal || "");
    } catch {
      setGoal("");
    }
  }, []);

  const save = () => {
    let current = {};
    try {
      current = JSON.parse(localStorage.getItem("clover-desk:mandalart:v1") || "{}");
    } catch {
      current = {};
    }
    localStorage.setItem("clover-desk:mandalart:v1", JSON.stringify({ ...current, mainGoal: goal, updatedAt: new Date().toISOString() }));
    onChange?.();
  };

  return (
    <GlassCard>
      <SectionTitle action={<AppButton onClick={save}>저장</AppButton>}>만다라트</SectionTitle>
      <div className="rounded-[26px] bg-violet-50/70 p-5">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-700">Mandalart</p>
        <label className="mt-3 grid gap-2 text-sm font-bold">
          내 삶의 최종 목표
          <AppTextarea value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="내 삶의 최종 목표를 적어보세요" />
        </label>
        <p className="mt-2 text-sm font-bold text-clover-sub">상단 탭에서 바로 확인하고 수정할 수 있게 했어요.</p>
      </div>
    </GlassCard>
  );
}

function ChoreSettings({ chores, shoppingItems, choreDraft, setChoreDraft, shoppingDraft, setShoppingDraft, today, onAddChore, onDeleteChore, onAddShopping, onToggleShopping, onUpdateShopping, onDeleteShopping }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      <GlassCard>
        <SectionTitle action={
          <div className="flex gap-2">
            {choreDraft.id && <AppButton variant="ghost" onClick={() => setChoreDraft(emptyChore(today))}>취소</AppButton>}
            <AppButton onClick={onAddChore}>{choreDraft.id ? "수정 저장" : "집안일 추가"}</AppButton>
          </div>
        }>
          {choreDraft.id ? "집안일 수정 중" : "집안일 설정"}
        </SectionTitle>
        <div className="grid gap-4 rounded-[26px] bg-white/45 p-4">
          <div>
            <p className="mb-2 text-sm font-black text-clover-text">종류</p>
            <div className="grid grid-cols-6 gap-2">
              {choreIcons.map((icon) => (
                <button key={icon} type="button" onClick={() => setChoreDraft({ ...choreDraft, icon })} className={`grid h-14 place-items-center rounded-2xl text-xl transition ${choreDraft.icon === icon ? "bg-violet-100 ring-2 ring-violet-500" : "bg-white/70"}`}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <AppInput value={choreDraft.title} onChange={(event) => setChoreDraft({ ...choreDraft, title: event.target.value })} placeholder="예: 분리수거 하기" />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-bold">
              날짜
              <AppInput type="date" value={choreDraft.nextDueDate || today} onChange={(event) => setChoreDraft({ ...choreDraft, nextDueDate: event.target.value })} />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              주기
              <AppSelect value={choreDraft.cycle || "매주"} onChange={(event) => setChoreDraft({ ...choreDraft, cycle: event.target.value })}>
                <option value="매일">매일</option>
                <option value="매주">매주</option>
                <option value="매달">매달</option>
                <option value="필요할 때">필요할 때</option>
              </AppSelect>
            </label>
          </div>
          <div>
            <p className="mb-2 text-sm font-black text-clover-text">요일</p>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((day) => {
                const selected = (choreDraft.days || []).includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setChoreDraft({ ...choreDraft, days: selected ? choreDraft.days.filter((item) => item !== day) : [...(choreDraft.days || []), day] })}
                    className={`grid h-9 w-9 place-items-center rounded-full text-sm font-black ${selected ? "bg-violet-500 text-white" : "bg-white/75 text-clover-sub"}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {chores.map((chore) => (
            <article key={chore.id} className="grid gap-3 rounded-[22px] bg-white/55 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <button type="button" onClick={() => setChoreDraft({ ...emptyChore(today), ...chore })} className="flex min-w-0 items-center gap-3 text-left">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-100 text-lg">{chore.icon || "🧺"}</span>
                <span className="min-w-0">
                  <span className="block truncate font-black">{chore.title}</span>
                  <span className="block text-xs font-bold text-clover-sub">{chore.nextDueDate || today} · {chore.cycle || "필요할 때"}</span>
                </span>
              </button>
              <div className="flex gap-2">
                <AppButton variant="ghost" onClick={() => setChoreDraft({ ...emptyChore(today), ...chore })}>수정</AppButton>
                <AppButton variant="ghost" onClick={() => onDeleteChore(chore.id)}>삭제</AppButton>
              </div>
            </article>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle action={
          <div className="flex gap-2">
            {shoppingDraft.id && <AppButton variant="ghost" onClick={() => setShoppingDraft(emptyShopping())}>취소</AppButton>}
            <AppButton onClick={onAddShopping}>{shoppingDraft.id ? "수정 저장" : "추가"}</AppButton>
          </div>
        }>
          {shoppingDraft.id ? "구매 항목 수정 중" : "구매 항목도 여기서"}
        </SectionTitle>
        <div className="grid gap-2">
          <AppInput value={shoppingDraft.title} onChange={(event) => setShoppingDraft({ ...shoppingDraft, title: event.target.value })} placeholder="예: 쓰레기봉투" />
          <div className="grid gap-2 sm:grid-cols-2">
            <AppSelect value={shoppingDraft.category} onChange={(event) => setShoppingDraft({ ...shoppingDraft, category: event.target.value })}>
              {shoppingCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </AppSelect>
            <AppInput type="number" value={shoppingDraft.price || ""} onChange={(event) => setShoppingDraft({ ...shoppingDraft, price: event.target.value })} placeholder="예상 가격" />
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/55 px-3 py-2">
            <span className="text-xs font-bold text-clover-sub">중요도</span>
            <StarRating value={shoppingDraft.importance || 0} onChange={(value) => setShoppingDraft({ ...shoppingDraft, importance: value })} />
          </div>
        </div>
        <div className="mt-4 grid gap-2">
          {shoppingItems.map((item) => (
            <article key={item.id} className={`grid gap-2 rounded-[20px] bg-white/55 p-3 ${item.completed ? "opacity-55" : ""}`}>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={Boolean(item.completed)} onChange={() => onToggleShopping(item)} className="h-4 w-4 accent-clover-deep" />
                <button type="button" onClick={() => setShoppingDraft({ ...emptyShopping(), ...item })} className="min-w-0 flex-1 text-left">
                  <p className="truncate font-bold">{item.title}</p>
                  <p className="text-xs font-bold text-clover-sub">{item.category} · {Number(item.price || 0) ? `${Number(item.price).toLocaleString()}원` : "가격 미정"}</p>
                </button>
                <button type="button" onClick={() => onDeleteShopping(item.id)} className="shrink-0 rounded-full px-3 py-2 text-xs font-black text-clover-sub hover:bg-white/70">삭제</button>
              </div>
              <StarRating value={item.importance || 0} onChange={(value) => onUpdateShopping(item.id, { importance: value })} size="text-sm" />
            </article>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

export default function LifePage() {
  const [data, setData] = useState(getAllData());
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "overview";
  const setTab = (nextTab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", nextTab);
    setSearchParams(next, { replace: true });
  };
  const [choreDraft, setChoreDraft] = useState(() => emptyChore(toDateKey(new Date())));
  const [shoppingDraft, setShoppingDraft] = useState(() => emptyShopping());
  const load = () => setData(getAllData());
  const today = toDateKey(new Date());

  useEffect(() => {
    window.addEventListener("clover-data-change", load);
    return () => window.removeEventListener("clover-data-change", load);
  }, []);

  const saveChore = () => {
    const title = choreDraft.title.trim();
    if (!title) return;
    const payload = { ...choreDraft, title, nextDueDate: choreDraft.nextDueDate || today, completed: false };
    if (payload.id) updateChore(payload.id, payload);
    else createChore(payload);
    setChoreDraft(emptyChore(today));
    load();
  };

  const addShopping = () => {
    const title = shoppingDraft.title.trim();
    if (!title) return;
    if (shoppingDraft.id) updateShoppingItem(shoppingDraft.id, { ...shoppingDraft, title });
    else createShoppingItem({ ...shoppingDraft, title, completed: false });
    setShoppingDraft(emptyShopping());
    load();
  };

  const updateShoppingField = (id, patch) => {
    updateShoppingItem(id, patch);
    load();
  };

  const completeChore = (chore) => {
    updateChore(chore.id, {
      completed: false,
      lastDoneAt: today,
      postponedAt: "",
      nextDueDate: nextDueDate(chore, today)
    });
    load();
  };

  const postponeChore = (chore) => {
    updateChore(chore.id, {
      completed: false,
      postponedAt: today,
      nextDueDate: today
    });
    load();
  };

  const toggleShopping = (item) => {
    if (item.completed) {
      updateShoppingItem(item.id, { completed: false, completedAt: "", linkedMoneyItemId: "" });
      load();
      return;
    }
    const amount = Number(item.price || item.amount || 0);
    if (amount > 0 && !item.linkedMoneyItemId) {
      const next = getAllData();
      const expenseId = makeId("expense");
      next.expenses = [
        {
          id: expenseId,
          title: item.title,
          amount,
          date: today,
          category: item.category || "생활용품",
          memo: "Life 구매 항목에서 완료 처리",
          createdAt: today,
          updatedAt: today
        },
        ...(next.expenses || [])
      ];
      next.shoppingItems = (next.shoppingItems || []).map((shopping) =>
        shopping.id === item.id ? { ...shopping, completed: true, completedAt: today, linkedMoneyItemId: expenseId, updatedAt: today } : shopping
      );
      saveAllData(next);
      load();
      return;
    }
    updateShoppingItem(item.id, { completed: true, completedAt: today });
    load();
  };

  return (
    <>
      <PageHeader eyebrow="LIFE" title="생활 허브" />

      <LifeTabs value={tab} onChange={setTab} />

      <div className="grid gap-4">
        {tab === "overview" && (
          <>
            <div className="grid gap-4 xl:grid-cols-[.82fr_1.18fr]">
              <ConditionSummaryCard data={data} today={today} onOpenJournal={() => setTab("journal")} />
              <TodayRecordGraph entries={data.moodEntries || []} today={today} />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <TodayChoreOverview chores={data.chores || []} today={today} onDone={completeChore} onPostpone={postponeChore} onManage={() => setTab("chores")} />
              <ShoppingQuickAdd items={data.shoppingItems || []} draft={shoppingDraft} setDraft={setShoppingDraft} onAdd={addShopping} onToggle={toggleShopping} />
            </div>
            <LifeHabitTracker data={data} onChange={load} />
            <div className="grid gap-4">
              <RecentLifeRecords data={data} today={today} onOpenJournal={() => setTab("journal")} />
            </div>
          </>
        )}

        {tab === "journal" && (
          <LifeJournalDetails data={data} today={today} onChange={load} />
        )}

        {tab === "habits" && <LifeHabitTracker data={data} onChange={load} />}

        {tab === "chores" && (
          <ChoreSettings
            chores={getChores()}
            shoppingItems={getShoppingItems()}
            choreDraft={choreDraft}
            setChoreDraft={setChoreDraft}
            shoppingDraft={shoppingDraft}
            setShoppingDraft={setShoppingDraft}
            today={today}
            onAddChore={saveChore}
            onDeleteChore={(id) => { deleteChore(id); load(); }}
            onAddShopping={addShopping}
            onToggleShopping={toggleShopping}
            onUpdateShopping={updateShoppingField}
            onDeleteShopping={(id) => { deleteShoppingItem(id); load(); }}
          />
        )}

        {tab === "mandalart" && (
          <LifeMandalartDetails onChange={load} />
        )}
      </div>
    </>
  );
}