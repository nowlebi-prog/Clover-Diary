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
import { addDays, toDateKey } from "../../lib/utils/habitSelectors";
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
  updateChore,
  updateShoppingItem
} from "../../lib/storage/localStorageAdapter";

const choreIcons = ["🧺", "🗑️", "🍳", "🧽", "🧹", "⭐"];
const weekDays = ["월", "화", "수", "목", "금", "토", "일"];
const emptyChore = (today) => ({ title: "", icon: "🧺", cycle: "매주", nextDueDate: today, days: [], completed: false });
const emptyShopping = () => ({ title: "", category: "생활용품", completed: false, memo: "", importance: 0 });

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

function TodayChoreOverview({ chores, today, onDone, onPostpone }) {
  const dueChores = chores
    .filter((item) => !item.archived && item.lastDoneAt !== today && (!item.nextDueDate || item.nextDueDate <= today))
    .slice(0, 5);

  return (
    <GlassCard>
      <SectionTitle>오늘 할 집안일</SectionTitle>
      <div className="grid gap-2">
        {dueChores.map((chore) => (
          <article key={chore.id} className="flex items-center gap-3 rounded-[22px] bg-white/60 p-3">
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
        {!dueChores.length && <p className="rounded-[22px] bg-white/45 p-4 text-sm font-bold text-clover-sub">오늘 꼭 처리할 집안일은 없어요.</p>}
      </div>
    </GlassCard>
  );
}

function ShoppingQuickAdd({ items, draft, setDraft, onAdd, onToggle }) {
  const openItems = items.filter((item) => !item.completed).slice(0, 4);
  return (
    <GlassCard>
      <SectionTitle>구매 항목</SectionTitle>
      <div className="grid gap-2 sm:grid-cols-[1fr_130px_auto]">
        <AppInput value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="예: 세탁세제" />
        <AppSelect value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
          {shoppingCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </AppSelect>
        <AppButton onClick={onAdd}>추가</AppButton>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {openItems.map((item) => (
          <button key={item.id} type="button" onClick={() => onToggle(item)} className="rounded-full bg-white/70 px-3 py-2 text-sm font-bold text-clover-text">
            {item.title}
          </button>
        ))}
        {!openItems.length && <p className="text-sm font-bold text-clover-sub">필요한 구매 항목을 바로 적어둘 수 있어요.</p>}
      </div>
    </GlassCard>
  );
}

function TodayRecordGraph({ entries, today }) {
  const entryByDate = (entries || []).reduce((map, item) => ({ ...map, [item.date]: item }), {});
  const days = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
  const hasRecord = days.some((date) => entryByDate[date]);

  return (
    <div className="glass rounded-[24px] bg-sky-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">오늘의 기록</p>
          <p className="mt-1 text-sm font-bold text-clover-sub">기분과 수면 흐름</p>
        </div>
        <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-black text-sky-700">오늘 흐름</span>
      </div>
      <div className="mt-4 h-28 rounded-2xl bg-white/55 p-3">
        {hasRecord ? (
          <div className="flex h-full items-end justify-between gap-2">
            {days.map((date) => {
              const entry = entryByDate[date] || {};
              const mood = Math.max(0, Math.min(5, Number(entry.score || 0)));
              const sleep = Math.max(0, Math.min(12, Number(entry.sleepHours || 0)));
              return (
                <div key={date} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-20 w-full items-end justify-center gap-1">
                    <span className="w-2 rounded-t-full bg-teal-400" style={{ height: mood ? `${Math.max(14, mood * 16)}%` : "8%" }} title={`기분 ${mood || "-"}점`} />
                    <span className="w-2 rounded-t-full bg-sky-300" style={{ height: sleep ? `${Math.max(14, sleep * 7)}%` : "8%" }} title={`수면 ${sleep || "-"}시간`} />
                  </div>
                  <span className={`text-[10px] font-black ${date === today ? "text-clover-deep" : "text-clover-sub/70"}`}>{Number(date.slice(-2))}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid h-full place-items-center text-sm font-bold text-clover-sub">아직 기록이 없어요.</div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] font-black text-clover-sub">
        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-teal-400" />기분</span>
        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-sky-300" />수면</span>
      </div>
    </div>
  );
}

const makeId = (name) => `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function LifeJournalDetails({ data, today, onChange }) {
  const mood = (data.moodEntries || []).find((item) => item.date === today);
  const reflection = (data.reflections || []).find((item) => item.date === today);
  const gratitudeEntry = (data.gratitudeEntries || []).find((item) => item.date === today);
  const [score, setScore] = useState(mood?.score || 3);
  const [sleepHours, setSleepHours] = useState(mood?.sleepHours || "");
  const [weather, setWeather] = useState(mood?.weather || "");
  const [summary, setSummary] = useState(reflection?.body || reflection?.memo || "");
  const [gratitude, setGratitude] = useState([0, 1, 2].map((index) => gratitudeEntry?.items?.[index] || ""));

  useEffect(() => {
    setScore(mood?.score || 3);
    setSleepHours(mood?.sleepHours || "");
    setWeather(mood?.weather || "");
    setSummary(reflection?.body || reflection?.memo || "");
    setGratitude([0, 1, 2].map((index) => gratitudeEntry?.items?.[index] || ""));
  }, [mood?.id, reflection?.id, gratitudeEntry?.id]);

  const save = () => {
    const next = getAllData();
    next.moodEntries = [
      {
        id: mood?.id || makeId("mood"),
        date: today,
        mood: "normal",
        emoji: "•",
        label: "오늘 기록",
        color: "#E7F0EA",
        score: Number(score) || 3,
        sleepHours: Number(sleepHours) || 0,
        weather: weather.trim(),
        photos: mood?.photos || [],
        createdAt: mood?.createdAt || today,
        updatedAt: today
      },
      ...(next.moodEntries || []).filter((item) => item.date !== today)
    ];
    next.reflections = [
      {
        id: reflection?.id || makeId("reflection"),
        date: today,
        title: "오늘 요약",
        body: summary.trim(),
        memo: summary.trim(),
        createdAt: reflection?.createdAt || today,
        updatedAt: today
      },
      ...(next.reflections || []).filter((item) => item.date !== today)
    ];
    next.gratitudeEntries = [
      {
        id: gratitudeEntry?.id || makeId("gratitude"),
        date: today,
        items: gratitude,
        createdAt: gratitudeEntry?.createdAt || today,
        updatedAt: today
      },
      ...(next.gratitudeEntries || []).filter((item) => item.date !== today)
    ];
    saveAllData(next);
    onChange?.();
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
      <GlassCard>
        <SectionTitle>오늘 기록</SectionTitle>
        <TodayRecordGraph entries={data.moodEntries || []} today={today} />
      </GlassCard>
      <GlassCard>
        <SectionTitle action={<AppButton onClick={save}>저장</AppButton>}>기록 작성</SectionTitle>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm font-bold">
            기분 점수
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
          <AppSelect value={shoppingDraft.category} onChange={(event) => setShoppingDraft({ ...shoppingDraft, category: event.target.value })}>
            {shoppingCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </AppSelect>
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
                  <p className="text-xs font-bold text-clover-sub">{item.category}</p>
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
    updateShoppingItem(item.id, { completed: !item.completed });
    load();
  };

  return (
    <>
      <PageHeader eyebrow="LIFE" title="생활 허브" />

      <LifeTabs value={tab} onChange={setTab} />

      <div className="grid gap-4">
        {tab === "overview" && <LifeHabitTracker data={data} onChange={load} />}

        {tab === "overview" && (
          <>
            <div className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
              <TodayRecordGraph entries={data.moodEntries || []} today={today} />
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
              <TodayChoreOverview chores={data.chores || []} today={today} onDone={completeChore} onPostpone={postponeChore} />
              <ShoppingQuickAdd items={data.shoppingItems || []} draft={shoppingDraft} setDraft={setShoppingDraft} onAdd={addShopping} onToggle={toggleShopping} />
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
