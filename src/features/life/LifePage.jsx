import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import StarRating from "../../components/common/StarRating";
import SubPageTabs from "../../components/common/SubPageTabs";
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

function LegacyLifeTabs({ value, onChange }) {
  const tabs = [["overview", "개요"], ["chores", "집안일"]];
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

function LifeTabs({ value, onChange }) {
  return (
    <SubPageTabs
      items={[
        { key: "overview", label: "개요", active: value === "overview", onClick: () => onChange("overview") },
        { key: "tasks", label: "전체 할 일", to: "/life/tasks" },
        { key: "chores", label: "집안일", active: value === "chores", onClick: () => onChange("chores") },
        { key: "habits", label: "습관", to: "/habits" },
        { key: "journal", label: "일기", to: "/journal" },
        { key: "mandalart", label: "만다라트", to: "/mandalart" }
      ]}
    />
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

function TodayRecordGraph({ entries, today }) {
  const entryByDate = (entries || []).reduce((map, item) => ({ ...map, [item.date]: item }), {});
  const days = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
  const hasRecord = days.some((date) => entryByDate[date]);

  return (
    <Link to="/journal" className="glass rounded-[24px] bg-sky-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">오늘의 기록</p>
          <p className="mt-1 text-sm font-bold text-clover-sub">기분과 수면 흐름</p>
        </div>
        <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-black text-sky-700">기록하기</span>
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
    </Link>
  );
}

export default function LifePage() {
  const [data, setData] = useState(getAllData());
  const [tab, setTab] = useState("overview");
  const [choreDraft, setChoreDraft] = useState(() => emptyChore(toDateKey(new Date())));
  const [shoppingDraft, setShoppingDraft] = useState(() => emptyShopping());
  const load = () => setData(getAllData());
  const today = toDateKey(new Date());
  const yesterday = toDateKey(new Date(Date.now() - 86400000));
  const activeHabits = (data.habits || []).filter((habit) => habit.status !== "archived");
  const habitRate = activeHabits.length
    ? Math.round(activeHabits.reduce((sum, habit) => sum + Number(habit.targetCount || 0), 0) / activeHabits.length)
    : 0;
  const moodByDate = (data.moodEntries || []).reduce((map, item) => ({ ...map, [item.date]: item }), {});
  const mandalartGoal = "";

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
      <PageHeader eyebrow="LIFE" title="생활 허브">
        <div className="hidden">
          <Link to="/habits"><AppButton variant="soft">Habits</AppButton></Link>
          <Link to="/journal"><AppButton variant="soft">Journal</AppButton></Link>
          <Link to="/mandalart"><AppButton variant="soft">Mandalart</AppButton></Link>
        </div>
      </PageHeader>

      <LifeTabs value={tab} onChange={setTab} />

      <div className="grid gap-4">
        {tab === "overview" && <LifeHabitTracker data={data} onChange={load} />}

        {tab === "overview" && (
          <>
            <div className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
              <TodayRecordGraph entries={data.moodEntries || []} today={today} />
              <TodayChoreOverview chores={data.chores || []} today={today} onDone={completeChore} onPostpone={postponeChore} />
            </div>
            <div className="hidden">
              <Link to="/habits" className="glass rounded-[24px] bg-emerald-50/70 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Habit tracker</p>
                <p className="mt-2 text-3xl font-black">{habitRate}%</p>
                <p className="mt-1 text-sm font-bold text-clover-sub">이번 달 전체 달성률</p>
              </Link>
              <Link to="/journal" className="glass rounded-[24px] bg-sky-50/70 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">오늘 기록</p>
                <div className="mt-4 flex h-20 items-end gap-3">
                  {[yesterday, today].map((date) => {
                    const score = Number(moodByDate[date]?.score || 0);
                    const height = score ? `${score * 18}%` : "12%";
                    return <span key={date} className="w-8 rounded-t-xl bg-sky-300" style={{ height }} title={date} />;
                  })}
                </div>
                <p className="mt-2 text-sm font-bold text-clover-sub">어제와 오늘 기분 흐름</p>
              </Link>
              <Link to="/mandalart" className="glass rounded-[24px] bg-violet-50/70 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-700">Mandalart</p>
                <p className="mt-3 line-clamp-2 text-lg font-black">{mandalartGoal || "내 삶의 최종 목표를 적어보세요"}</p>
                <p className="mt-2 text-sm font-bold text-clover-sub">삶의 방향표</p>
              </Link>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <ShoppingQuickAdd items={data.shoppingItems || []} draft={shoppingDraft} setDraft={setShoppingDraft} onAdd={addShopping} onToggle={toggleShopping} />
            </div>
          </>
        )}

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
      </div>
    </>
  );
}
