import { useMemo, useState } from "react";
import AppButton from "../../components/common/AppButton";
import AppInput from "../../components/common/AppInput";
import AppSelect from "../../components/common/AppSelect";
import AppTextarea from "../../components/common/AppTextarea";
import GlassCard from "../../components/common/GlassCard";
import SectionTitle from "../../components/common/SectionTitle";
import StarRating from "../../components/common/StarRating";
import PageHeader from "../../components/layout/PageHeader";
import { getAllData, moveToTrash, saveAllData } from "../../lib/storage/localStorageAdapter";
import { toDateKey } from "../../lib/utils/date";
import { shoppingCategories } from "../../lib/utils/shoppingConstants";

const MONEY_PASSWORD = import.meta.env.VITE_MONEY_PASSWORD || "986454";
const sum = (items, field = "amount") => items.reduce((total, item) => total + Number(item[field] || 0), 0);
const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const money = (value) => `${Number(value || 0).toLocaleString()}원`;
const weekdayLabel = (dateKey) => ["일", "월", "화", "수", "목", "금", "토"][new Date(`${dateKey}T00:00:00`).getDay()];
const PIE_COLORS = ["#FB7185", "#F6A845", "#FBCF4A", "#8DDFA8", "#6DCBD6", "#8FA6F0", "#C39BE8", "#F0A6C8"];

function MoneyGate({ onUnlock }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    if (password === MONEY_PASSWORD) {
      sessionStorage.setItem("clover-money-unlocked", "true");
      onUnlock();
    } else {
      setError("비밀번호가 맞지 않아요.");
    }
  };
  return (
    <>
      <PageHeader eyebrow="MONEY" title="돈관리 잠금" />
      <GlassCard className="mx-auto max-w-md">
        <SectionTitle>비밀번호 입력</SectionTitle>
        <p className="mb-4 text-sm font-bold text-clover-sub">금액 정보라 한 번 더 확인할게요.</p>
        <div className="grid gap-3">
          <AppInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submit()} placeholder="비밀번호" autoFocus />
          {error && <p className="text-sm font-bold text-red-500">{error}</p>}
          <AppButton onClick={submit}>Money 열기</AppButton>
        </div>
      </GlassCard>
    </>
  );
}

function MoneySection({ title, action, onAction, children }) {
  return (
    <GlassCard>
      <SectionTitle action={action ? <button className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-clover-deep" onClick={onAction}>{action}</button> : null}>{title}</SectionTitle>
      <div className="grid gap-2">{children}</div>
    </GlassCard>
  );
}

function SummaryHero({ income, spending, subscriptions, variable }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-[26px] bg-gradient-to-br from-sky-400 to-indigo-500 p-5 text-white shadow-glass">
        <p className="text-xs font-black uppercase tracking-[0.14em] opacity-80">총 수입</p>
        <p className="mt-2 text-3xl font-black">{money(income)}</p>
      </div>
      <div className="rounded-[26px] bg-gradient-to-br from-fuchsia-400 to-rose-500 p-5 text-white shadow-glass">
        <p className="text-xs font-black uppercase tracking-[0.14em] opacity-80">총 지출</p>
        <p className="mt-2 text-3xl font-black">{money(spending)}</p>
      </div>
      <div className="rounded-[22px] bg-white/70 p-4">
        <p className="text-xs font-black text-clover-sub">정기지출</p>
        <p className="mt-1 text-xl font-black text-clover-deep">{money(subscriptions)}</p>
      </div>
      <div className="rounded-[22px] bg-white/70 p-4">
        <p className="text-xs font-black text-clover-sub">변동지출</p>
        <p className="mt-1 text-xl font-black text-clover-deep">{money(variable)}</p>
      </div>
    </div>
  );
}

function DailyLedger({ monthKey, onShiftMonth, expenses, incomeItems, income, spending, onOpenExpense, onOpenIncome }) {
  const byDate = useMemo(() => {
    const map = new Map();
    const push = (dateKey, kind, entry) => {
      if (!dateKey) return;
      if (!map.has(dateKey)) map.set(dateKey, { date: dateKey, income: [], expense: [] });
      map.get(dateKey)[kind].push(entry);
    };
    expenses.forEach((item) => push(item.date, "expense", item));
    incomeItems.forEach((item) => push(item.expectedDate || item.paidDate, "income", item));
    return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [expenses, incomeItems]);
  const [year, month] = monthKey.split("-");

  return (
    <GlassCard>
      <div className="flex items-center justify-between gap-3">
        <button className="rounded-full bg-white/70 px-3 py-1.5 text-sm font-black" onClick={() => onShiftMonth(-1)}>이전</button>
        <SectionTitle>{year}년 {Number(month)}월 가계부</SectionTitle>
        <button className="rounded-full bg-white/70 px-3 py-1.5 text-sm font-black" onClick={() => onShiftMonth(1)}>다음</button>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-white/55 p-3 text-center">
        <div><p className="text-xs font-black text-clover-sub">수입</p><p className="mt-1 font-black text-sky-600">{money(income)}</p></div>
        <div><p className="text-xs font-black text-clover-sub">지출</p><p className="mt-1 font-black text-rose-600">{money(spending)}</p></div>
        <div><p className="text-xs font-black text-clover-sub">합계</p><p className={`mt-1 font-black ${income - spending >= 0 ? "text-clover-deep" : "text-rose-600"}`}>{money(income - spending)}</p></div>
      </div>
      <div className="grid gap-3">
        {byDate.map((day) => {
          const dayIncome = sum(day.income);
          const dayExpense = sum(day.expense);
          return (
            <div key={day.date} className="rounded-[22px] bg-white/50 p-3">
              <div className="flex items-baseline justify-between">
                <p className="text-lg font-black">{Number(day.date.slice(-2))}<span className="ml-2 rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-clover-sub">{weekdayLabel(day.date)}요일</span></p>
                <p className="text-sm font-black">
                  {!!dayIncome && <span className="text-sky-600">{money(dayIncome)}</span>}
                  {!!dayIncome && !!dayExpense && <span className="mx-1 text-clover-sub">·</span>}
                  {!!dayExpense && <span className="text-rose-600">{money(dayExpense)}</span>}
                </p>
              </div>
              <div className="mt-2 grid gap-1.5">
                {day.income.map((item) => (
                  <button key={item.id} onClick={() => onOpenIncome(item)} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2 text-left text-sm">
                    <span className="min-w-0 truncate"><span className="mr-2 text-xs font-bold text-clover-sub">{item.category || "수입"}</span>{item.project || item.client || "수입"}</span>
                    <span className="shrink-0 font-black text-sky-600">{money(item.amount)}</span>
                  </button>
                ))}
                {day.expense.map((item) => (
                  <button key={item.id} onClick={() => onOpenExpense(item)} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2 text-left text-sm">
                    <span className="min-w-0 truncate"><span className="mr-2 text-xs font-bold text-clover-sub">{item.category || "기타"}</span>{item.title}</span>
                    <span className="shrink-0 font-black text-rose-600">{money(item.amount)}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {!byDate.length && <p className="rounded-2xl bg-white/45 p-6 text-center text-sm font-bold text-clover-sub">이번 달 기록이 아직 없어요.</p>}
      </div>
    </GlassCard>
  );
}

function CategoryPie({ segments, total }) {
  if (!total) return <MoneySection title="카테고리별 지출"><p className="rounded-2xl bg-white/45 p-6 text-center text-sm font-bold text-clover-sub">이번 달 지출 기록이 아직 없어요.</p></MoneySection>;
  let cursor = 0;
  const stops = segments.map((segment, index) => {
    const pct = (segment.value / total) * 100;
    const start = cursor;
    cursor += pct;
    return { ...segment, pct, start, end: cursor, color: PIE_COLORS[index % PIE_COLORS.length] };
  });
  const gradient = stops.map((s) => `${s.color} ${s.start}% ${s.end}%`).join(", ");
  return (
    <MoneySection title="카테고리별 지출">
      <div className="grid place-items-center py-3"><div className="h-40 w-40 rounded-full shadow-inner" style={{ background: `conic-gradient(${gradient})` }} /></div>
      {stops.map((s) => (
        <div key={s.name} className="flex items-center gap-2 rounded-xl bg-white/45 px-3 py-2 text-sm">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
          <span className="min-w-0 flex-1 truncate font-bold">{s.name}</span>
          <span className="shrink-0 text-xs font-black text-clover-sub">{s.pct.toFixed(1)}%</span>
          <span className="shrink-0 font-black text-clover-deep">{money(s.value)}</span>
        </div>
      ))}
    </MoneySection>
  );
}

function GapYearUploadSection({ expenses, onOpenExpense, onToggleUploaded }) {
  const gapItems = expenses.filter((item) => item.gapYearRequired || item.gapYearUploaded).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const pending = gapItems.filter((item) => !item.gapYearUploaded);
  const done = gapItems.filter((item) => item.gapYearUploaded);

  return (
    <MoneySection title="갭이어 증빙 업로드" action="+ 대상 지출" onAction={() => onOpenExpense({ date: toDateKey(new Date()), gapYearRequired: true, category: "갭이어" })}>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-rose-50 p-3"><p className="text-xs font-black text-rose-700">업로드 필요</p><p className="mt-1 text-2xl font-black">{pending.length}건</p></div>
        <div className="rounded-2xl bg-emerald-50 p-3"><p className="text-xs font-black text-emerald-700">업로드 완료</p><p className="mt-1 text-2xl font-black">{done.length}건</p></div>
      </div>
      <div className="mt-2 grid gap-2">
        {gapItems.slice(0, 10).map((item) => (
          <article key={item.id} className={`rounded-2xl px-4 py-3 text-sm font-bold ${item.gapYearUploaded ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
            <div className="flex items-start justify-between gap-3">
              <button type="button" onClick={() => onOpenExpense(item)} className="min-w-0 flex-1 text-left">
                <span className="block truncate">{item.title || "지출"}</span>
                <span className="mt-1 block text-xs opacity-75">{item.date || "날짜 없음"} · {money(item.amount)}</span>
              </button>
              <button type="button" onClick={() => onToggleUploaded(item)} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-black">{item.gapYearUploaded ? "완료됨" : "완료"}</button>
            </div>
          </article>
        ))}
        {!gapItems.length && <p className="rounded-2xl bg-white/40 p-4 text-sm font-bold text-clover-sub">갭이어 증빙 대상 지출이 아직 없어요.</p>}
      </div>
    </MoneySection>
  );
}

export default function MoneyPage() {
  const [unlocked, setUnlocked] = useState(sessionStorage.getItem("clover-money-unlocked") === "true");
  const [data, setData] = useState(getAllData());
  const [editor, setEditor] = useState(null);
  const [monthOffset, setMonthOffset] = useState(0);

  if (!unlocked) return <MoneyGate onUnlock={() => setUnlocked(true)} />;

  const today = toDateKey(new Date());
  const monthDate = new Date();
  monthDate.setMonth(monthDate.getMonth() + monthOffset);
  const monthKey = toDateKey(monthDate).slice(0, 7);
  const expenses = data.expenses || [];
  const payments = data.payments || [];
  const subscriptions = data.subscriptions || [];
  const shoppingItems = data.shoppingItems || [];
  const savings = data.savings || [];
  const monthExpenses = expenses.filter((item) => (item.date || "").startsWith(monthKey));
  const incomeItems = payments.filter((item) => (item.expectedDate || item.paidDate || "").startsWith(monthKey));
  const income = sum(incomeItems);
  const spending = sum(monthExpenses);
  const subscriptionTotal = sum(subscriptions.filter((item) => item.active !== false));
  const variableExpenses = monthExpenses.filter((item) => !subscriptions.some((sub) => sub.title === item.title));
  const variableTotal = sum(variableExpenses);
  const categorySegments = useMemo(() => {
    const totals = {};
    monthExpenses.forEach((item) => {
      const key = item.category || "기타";
      totals[key] = (totals[key] || 0) + Number(item.amount || 0);
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [monthExpenses]);

  const persist = (next) => {
    saveAllData(next);
    setData(getAllData());
  };

  const upsert = (collection, item) => {
    const next = getAllData();
    const current = next[collection] || [];
    const normalized = { ...item, id: item.id || makeId(collection), updatedAt: today, createdAt: item.createdAt || today };
    next[collection] = item.id ? current.map((entry) => entry.id === item.id ? normalized : entry) : [normalized, ...current];
    persist(next);
    setEditor(null);
  };

  const remove = (collection, id) => {
    const next = getAllData();
    moveToTrash(next, collection, id);
    persist(next);
    setEditor(null);
  };

  const toggleGapYearUploaded = (expense) => {
    const next = getAllData();
    next.expenses = (next.expenses || []).map((item) =>
      item.id === expense.id ? { ...item, gapYearRequired: true, gapYearUploaded: !item.gapYearUploaded, updatedAt: today } : item
    );
    persist(next);
  };

  const lock = () => {
    sessionStorage.removeItem("clover-money-unlocked");
    setUnlocked(false);
  };

  return (
    <>
      <PageHeader eyebrow="MONEY" title="돈관리 현황">
        <div className="flex flex-wrap items-center gap-2">
          <AppButton variant="soft" onClick={() => setEditor({ type: "expense", item: { date: today, category: "생활비" } })}>+ 지출</AppButton>
          <AppButton variant="soft" onClick={() => setEditor({ type: "payment", item: { expectedDate: today } })}>+ 수입</AppButton>
          <AppButton variant="soft" onClick={lock}>잠그기</AppButton>
        </div>
      </PageHeader>

      <div className="mb-4"><SummaryHero income={income} spending={spending} subscriptions={subscriptionTotal} variable={variableTotal} /></div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <DailyLedger
          monthKey={monthKey}
          onShiftMonth={(delta) => setMonthOffset((value) => value + delta)}
          expenses={monthExpenses}
          incomeItems={incomeItems}
          income={income}
          spending={spending}
          onOpenExpense={(item) => setEditor({ type: "expense", item })}
          onOpenIncome={(item) => setEditor({ type: "payment", item })}
        />
        <div className="grid content-start gap-4">
          <CategoryPie segments={categorySegments} total={spending} />
          <GapYearUploadSection expenses={expenses} onOpenExpense={(item) => setEditor({ type: "expense", item })} onToggleUploaded={toggleGapYearUploaded} />
          <MoneySection title="구독·결제 관리" action="+ 구독" onAction={() => setEditor({ type: "subscription", item: { active: true, billingDay: "1", status: "유지" } })}>
            {subscriptions.slice(0, 8).map((item) => (
              <button key={item.id} onClick={() => setEditor({ type: "subscription", item })} className="flex items-center justify-between rounded-2xl bg-white/55 px-4 py-3 text-left text-sm font-bold">
                <span>{item.title}</span><span className="text-clover-deep">{money(item.amount)} · {item.billingDay}일</span>
              </button>
            ))}
            {!subscriptions.length && <p className="rounded-2xl bg-white/40 p-4 text-sm font-bold text-clover-sub">등록한 구독이 없어요.</p>}
          </MoneySection>
          <MoneySection title="구매 필요 항목" action="+ 구매 항목" onAction={() => setEditor({ type: "shopping", item: { importance: 3, category: shoppingCategories[0] } })}>
            {shoppingItems.filter((item) => !item.completed).slice(0, 8).map((item) => (
              <button key={item.id} onClick={() => setEditor({ type: "shopping", item })} className="rounded-2xl bg-white/55 px-4 py-3 text-left text-sm font-bold">
                <div className="flex items-center justify-between gap-3"><span className="truncate">{item.title}</span>{!!item.amount && <span className="shrink-0 text-clover-sub">{money(item.amount)}</span>}</div>
                <div className="mt-1 flex items-center justify-between"><span className="text-xs font-bold text-clover-sub">{item.category || "기타"}</span><StarRating value={item.importance || 0} onChange={() => {}} size="text-xs" /></div>
              </button>
            ))}
            {!shoppingItems.filter((item) => !item.completed).length && <p className="rounded-2xl bg-white/40 p-4 text-sm font-bold text-clover-sub">구매할 항목이 없어요.</p>}
          </MoneySection>
          <MoneySection title="저축" action="+ 저축" onAction={() => setEditor({ type: "saving", item: { date: today } })}>
            {savings.slice(0, 8).map((item) => (
              <button key={item.id} onClick={() => setEditor({ type: "saving", item })} className="flex items-center justify-between rounded-2xl bg-white/55 px-4 py-3 text-left text-sm font-bold">
                <span className="min-w-0 truncate">{item.title || "저축"}</span><span className="shrink-0 text-emerald-700">{money(item.amount)}</span>
              </button>
            ))}
            {!savings.length && <p className="rounded-2xl bg-white/40 p-4 text-sm font-bold text-clover-sub">저축 기록을 추가해보세요.</p>}
          </MoneySection>
        </div>
      </div>

      {editor && <MoneyEditor editor={editor} onClose={() => setEditor(null)} onSave={upsert} onDelete={remove} />}
    </>
  );
}

function MoneyEditor({ editor, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(editor.item || {});
  const type = editor.type;
  const collection = type === "subscription" ? "subscriptions" : type === "shopping" ? "shoppingItems" : type === "saving" ? "savings" : type === "expense" ? "expenses" : "payments";
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const title = type === "shopping" ? "구매 항목 편집" : type === "subscription" ? "구독 편집" : type === "saving" ? "저축 편집" : type === "expense" ? "지출 편집" : "수입 편집";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-clover-ink/20 px-4 backdrop-blur-sm">
      <section className="glass w-full max-w-xl rounded-[28px] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black">{title}</h3>
          <button className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black" onClick={onClose}>닫기</button>
        </div>
        <div className="grid gap-3">
          {type === "payment" && (
            <>
              <AppInput value={form.client || ""} onChange={(e) => set("client", e.target.value)} placeholder="거래처명" />
              <AppInput value={form.project || ""} onChange={(e) => set("project", e.target.value)} placeholder="프로젝트명" />
              <AppSelect value={form.category || "자유소득"} onChange={(e) => set("category", e.target.value)}><option>자유소득</option><option>급여</option><option>기타</option></AppSelect>
              <AppInput type="number" value={form.amount || ""} onChange={(e) => set("amount", e.target.value)} placeholder="총액" />
              <AppSelect value={form.status || "입금 예정"} onChange={(e) => set("status", e.target.value)}><option>입금 예정</option><option>계약금 완료</option><option>잔금 미입금</option><option>입금 완료</option><option>세금계산서 발행</option></AppSelect>
              <AppInput type="date" value={form.expectedDate || ""} onChange={(e) => set("expectedDate", e.target.value)} />
            </>
          )}
          {type === "expense" && (
            <>
              <AppInput value={form.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="지출 항목" />
              <AppSelect value={form.category || "생활비"} onChange={(e) => set("category", e.target.value)}><option>생활비</option><option>교통비</option><option>업무비</option><option>식비</option><option>갭이어</option><option>기타</option></AppSelect>
              <AppInput type="number" value={form.amount || ""} onChange={(e) => set("amount", e.target.value)} placeholder="금액" />
              <AppInput type="date" value={form.date || ""} onChange={(e) => set("date", e.target.value)} />
              <label className="flex items-center justify-between rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                갭이어 업로드 대상
                <input type="checkbox" checked={Boolean(form.gapYearRequired || form.gapYearUploaded)} onChange={(e) => set("gapYearRequired", e.target.checked)} />
              </label>
              {(form.gapYearRequired || form.gapYearUploaded) && (
                <label className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  증빙 업로드 완료
                  <input type="checkbox" checked={Boolean(form.gapYearUploaded)} onChange={(e) => set("gapYearUploaded", e.target.checked)} />
                </label>
              )}
            </>
          )}
          {type === "subscription" && (
            <>
              <AppInput value={form.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="서비스명" />
              <AppInput type="number" value={form.amount || ""} onChange={(e) => set("amount", e.target.value)} placeholder="금액" />
              <AppInput value={form.billingDay || ""} onChange={(e) => set("billingDay", e.target.value)} placeholder="결제일 예: 15" />
              <AppSelect value={form.status || "유지"} onChange={(e) => set("status", e.target.value)}><option>유지</option><option>해지 고민</option><option>해지 예정</option></AppSelect>
            </>
          )}
          {type === "shopping" && (
            <>
              <AppInput value={form.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="항목 이름" />
              <AppSelect value={form.category || shoppingCategories[0]} onChange={(e) => set("category", e.target.value)}>{shoppingCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}</AppSelect>
              <div className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2"><span className="text-xs font-bold text-clover-sub">중요도</span><StarRating value={form.importance || 0} onChange={(value) => set("importance", value)} /></div>
              <AppInput type="number" value={form.amount || ""} onChange={(e) => set("amount", e.target.value)} placeholder="금액" />
              <AppInput value={form.link || ""} onChange={(e) => set("link", e.target.value)} placeholder="링크" />
              <AppTextarea value={form.memo || ""} onChange={(e) => set("memo", e.target.value)} placeholder="메모" />
              <label className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold">구매 완료<input type="checkbox" checked={Boolean(form.completed)} onChange={(e) => set("completed", e.target.checked)} /></label>
            </>
          )}
          {type === "saving" && (
            <>
              <AppInput value={form.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="저축 이름" />
              <AppInput type="number" value={form.amount || ""} onChange={(e) => set("amount", e.target.value)} placeholder="금액" />
              <AppInput type="date" value={form.date || ""} onChange={(e) => set("date", e.target.value)} />
              <AppTextarea value={form.memo || ""} onChange={(e) => set("memo", e.target.value)} placeholder="메모" />
            </>
          )}
        </div>
        <div className="mt-5 flex justify-between gap-2">
          {form.id ? <button className="rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-600" onClick={() => onDelete(collection, form.id)}>삭제</button> : <span />}
          <AppButton onClick={() => onSave(collection, form)}>저장</AppButton>
        </div>
      </section>
    </div>
  );
}
